package com.example.IT3030_PAF_Assignment_2026_WD_320_42.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/**
 * Configures the application DataSource.
 *
 * Connection strategy:
 *  1. Start the SQL Server LocalDB instance (MSSQLLocalDB) via sqllocaldb.
 *  2. Resolve the dynamic named-pipe suffix via `sqllocaldb info`.
 *  3. Start a PowerShell TCP-to-named-pipe proxy (localdb-proxy.ps1).
 *     – The proxy bridges a random localhost TCP port to the LocalDB named pipe.
 *  4. Use sqlcmd (Windows auth – always works for the pipe owner) to:
 *       • Create the SQL login `smartcampus_app` with a password.
 *       • Create the `smart_campus` database if absent.
 *       • Create the DB user and grant db_owner.
 *  5. Connect via jTDS over TCP using SQL auth (username + password).
 *     – SQL auth travels inside TDS; no sqljdbc_auth.dll / SSPI native DLL needed.
 *     – jTDS NTLM is only needed for Windows auth; SQL auth is 100% pure-Java.
 *  6. If any step fails → fall back to embedded H2 file database so the server
 *     still starts and all endpoints remain reachable.
 *
 * The `smart_campus` database in SQL Server Management Studio is the real target.
 * H2 is a last-resort safety net only.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    // ── LocalDB ──────────────────────────────────────────────────────────────────
    private static final String LOCALDB_INSTANCE = "MSSQLLocalDB";
    private static final String APP_DB_NAME      = "smart_campus";

    // ── SQL login (SQL auth = no native DLL) ─────────────────────────────────────
    private static final String SQL_USER = "smartcampus_app";
    private static final String SQL_PASS = "SmartCampus2026!";

    // ── Drivers ──────────────────────────────────────────────────────────────────
    // jTDS for TCP (SQL auth, no native library needed)
    private static final String JTDS_DRIVER = "net.sourceforge.jtds.jdbc.Driver";
    private static final String H2_DRIVER   = "org.h2.Driver";
    private static final String H2_URL      =
        "jdbc:h2:file:./data/" + APP_DB_NAME
        + ";MODE=MSSQLServer;DB_CLOSE_ON_EXIT=FALSE";

    /** The PowerShell proxy process – kept alive for the app's lifetime. */
    private Process proxyProcess;

    @jakarta.annotation.PreDestroy
    public void cleanup() {
        if (proxyProcess != null && proxyProcess.isAlive()) {
            proxyProcess.destroyForcibly();
            logger.info("LocalDB proxy process destroyed.");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────

    @Bean
    public DataSource dataSource() {
        try {
            // 1. Ensure LocalDB is running.
            startLocalDbInstance();

            // 2. Resolve the named-pipe suffix (e.g. LOCALDB#4350F2F2\tsql\query).
            String pipeSuffix = resolvePipeSuffix();
            logger.info("LocalDB pipe suffix: {}", pipeSuffix);

            // 3. Start the TCP-to-named-pipe proxy and get its port.
            int proxyPort = startProxy(pipeSuffix);
            logger.info("TCP proxy listening on port {}", proxyPort);

            // 4. Bootstrap the SQL login + database via sqlcmd (Windows auth).
            setupLoginAndDatabase();

            // 5. Return a jTDS DataSource using SQL auth over the proxy port.
            //    SQL auth (user/password in TDS) requires NO Windows auth DLL.
            String appUrl = buildJtdsTcpUrl(APP_DB_NAME, proxyPort);
            logger.info("DataSource ready → SQL Server LocalDB:{} via proxy port {}",
                        APP_DB_NAME, proxyPort);
            return buildDataSource(JTDS_DRIVER, appUrl, SQL_USER, SQL_PASS);

        } catch (Exception ex) {
            // Kill the proxy if it was started but something else failed.
            if (proxyProcess != null && proxyProcess.isAlive()) {
                proxyProcess.destroyForcibly();
                proxyProcess = null;
            }
            logger.warn(
                "SQL Server LocalDB unavailable ({}). Falling back to H2 at ./data/{}.",
                ex.getMessage(), APP_DB_NAME
            );
            return buildDataSource(H2_DRIVER, H2_URL, null, null);
        }
    }

    // ── jTDS TCP URL ──────────────────────────────────────────────────────────────
    /**
     * Builds a jTDS TCP JDBC URL pointing at the proxy port.
     *
     * SQL auth (user/password) travels inside the TDS login packet – no
     * integratedSecurity flag, no sqljdbc_auth.dll, no SSPI token required.
     */
    private String buildJtdsTcpUrl(String database, int port) {
        return "jdbc:jtds:sqlserver://localhost:" + port + "/" + database
             + ";loginTimeout=30"
             + ";socketTimeout=60";
    }

    // ── sqlcmd bootstrap ─────────────────────────────────────────────────────────

    /**
     * Creates the SQL login, verifies the database, and grants db_owner.
     * sqlcmd uses Windows auth (the pipe owner = current user), which always works.
     * All statements are idempotent – safe to run on every startup.
     */
    private void setupLoginAndDatabase() {
        // A) Server-level SQL login.
        runSqlcmd(null,
            "IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'" + SQL_USER + "') "
          + "BEGIN "
          +   "CREATE LOGIN [" + SQL_USER + "] "
          +   "WITH PASSWORD = N'" + SQL_PASS + "', "
          +   "CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF "
          + "END"
        );

        // B) Create smart_campus database if missing.
        runSqlcmd(null,
            "IF DB_ID(N'" + APP_DB_NAME + "') IS NULL "
          + "BEGIN CREATE DATABASE [" + APP_DB_NAME + "] END"
        );

        // C) DB user + db_owner role inside smart_campus.
        runSqlcmd(APP_DB_NAME,
            "IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'" + SQL_USER + "') "
          + "BEGIN "
          +   "CREATE USER [" + SQL_USER + "] FOR LOGIN [" + SQL_USER + "]; "
          +   "ALTER ROLE db_owner ADD MEMBER [" + SQL_USER + "] "
          + "END"
        );

        logger.info("SQL login '{}' and database '{}' verified.", SQL_USER, APP_DB_NAME);
    }

    /**
     * Executes a T-SQL statement via sqlcmd with Windows authentication.
     * @param database  value for sqlcmd -d flag (null = default / master)
     * @param sql       T-SQL to run
     */
    private void runSqlcmd(String database, String sql) {
        List<String> cmd = new ArrayList<>();
        cmd.add("sqlcmd");
        cmd.add("-S");
        cmd.add("(localdb)\\" + LOCALDB_INSTANCE);
        if (database != null) {
            cmd.add("-d");
            cmd.add(database);
        }
        cmd.add("-Q");
        cmd.add(sql);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        try {
            Process proc = pb.start();
            String output;
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                output = br.lines().collect(Collectors.joining("\n")).trim();
            }
            int exit = proc.waitFor();
            if (!output.isEmpty()) {
                logger.debug("sqlcmd: {}", output);
            }
            if (exit != 0) {
                throw new IllegalStateException("sqlcmd failed (exit " + exit + "): " + output);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted waiting for sqlcmd.", e);
        } catch (IOException e) {
            throw new IllegalStateException("sqlcmd not found on PATH.", e);
        }
    }

    // ── proxy ────────────────────────────────────────────────────────────────────

    /**
     * Starts localdb-proxy.ps1 which listens on a random TCP port and forwards
     * bytes to the LocalDB named pipe.  Returns the chosen port number.
     */
    private int startProxy(String pipeSuffix) {
        File script = new File("localdb-proxy.ps1");
        if (!script.exists()) {
            throw new IllegalStateException(
                "localdb-proxy.ps1 not found in project root (" + new File(".").getAbsolutePath() + ").");
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
                "-File", script.getAbsolutePath(),
                pipeSuffix
            );
            pb.redirectErrorStream(true);
            proxyProcess = pb.start();

            // The script prints "PROXY_PORT=<n>" to stdout, then enters its accept loop.
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(proxyProcess.getInputStream(), StandardCharsets.UTF_8));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("PROXY_PORT=")) {
                    int port = Integer.parseInt(line.substring("PROXY_PORT=".length()).trim());
                    // Give the proxy loop a moment to enter its accept-pending state.
                    try { Thread.sleep(600); } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    return port;
                }
            }
            throw new IllegalStateException(
                "Proxy process exited without printing PROXY_PORT. "
                + (proxyProcess.isAlive() ? "(still running)" : "exit=" + proxyProcess.exitValue())
            );
        } catch (IOException e) {
            throw new IllegalStateException("Failed to start proxy process.", e);
        }
    }

    // ── sqllocaldb helpers ────────────────────────────────────────────────────────

    private void startLocalDbInstance() {
        try {
            String out = runSqlLocalDb("start", LOCALDB_INSTANCE);
            logger.info("sqllocaldb start: {}", out.isEmpty() ? "OK" : out);
        } catch (Exception ex) {
            logger.warn("sqllocaldb start warning (instance may already be running): {}",
                        ex.getMessage());
        }
    }

    /**
     * Extracts the dynamic pipe suffix from `sqllocaldb info`.
     *
     * Example line:  "Instance pipe name: np:\\.\pipe\LOCALDB#4350F2F2\tsql\query"
     * Returns:       "LOCALDB#4350F2F2\tsql\query"
     *
     * The suffix is the part after "\pipe\" – it is what localdb-proxy.ps1 expects.
     */
    private String resolvePipeSuffix() {
        String output = runSqlLocalDb("info", LOCALDB_INSTANCE);
        for (String line : output.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("Instance pipe name:")) {
                // fullPath = "np:\\.\pipe\LOCALDB#XXXXXXXX\tsql\query"
                String fullPath = trimmed.substring("Instance pipe name:".length()).trim();
                int pipeIdx = fullPath.indexOf("\\pipe\\");
                if (pipeIdx >= 0) {
                    return fullPath.substring(pipeIdx + "\\pipe\\".length());
                }
            }
        }
        throw new IllegalStateException(
            "Could not resolve LocalDB pipe name from sqllocaldb info:\n" + output
        );
    }

    /** Runs `sqllocaldb <args>`. Returns trimmed stdout. Throws on non-zero exit. */
    private String runSqlLocalDb(String... args) {
        List<String> cmd = new ArrayList<>();
        cmd.add("sqllocaldb");
        cmd.addAll(Arrays.asList(args));
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        try {
            Process proc = pb.start();
            String output;
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                output = br.lines().collect(Collectors.joining(System.lineSeparator())).trim();
            }
            int exit = proc.waitFor();
            if (exit != 0) {
                throw new IllegalStateException(
                    "sqllocaldb " + String.join(" ", args) + " exited " + exit + ": " + output);
            }
            return output;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted waiting for sqllocaldb.", e);
        } catch (IOException e) {
            throw new IllegalStateException(
                "sqllocaldb not found. Is SQL Server LocalDB installed?", e);
        }
    }

    // ── DataSource builder ────────────────────────────────────────────────────────

    private DataSource buildDataSource(String driverClass, String url,
                                       String user, String password) {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName(driverClass);
        ds.setUrl(url);
        if (user     != null) ds.setUsername(user);
        if (password != null) ds.setPassword(password);
        return ds;
    }
}
