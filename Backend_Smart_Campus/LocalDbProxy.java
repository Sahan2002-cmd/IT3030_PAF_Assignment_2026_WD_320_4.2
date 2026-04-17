import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.ServerSocket;
import java.net.Socket;

public class LocalDbProxy {
    public static void main(String[] args) throws Exception {
        String pipeName = "\\\\.\\pipe\\LOCALDB#4350F2F2\\tsql\\query";
        
        ServerSocket server = new ServerSocket(0); // Random port
        int port = server.getLocalPort();
        System.out.println("PROXY_PORT=" + port);
        
        new Thread(() -> {
            try {
                while (true) {
                    Socket client = server.accept();
                    handle(client, pipeName);
                }
            } catch (Exception e) {}
        }).start();

        // Now test JDBC
        Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        String url = "jdbc:sqlserver://localhost:" + port + ";databaseName=smart_campus;integratedSecurity=true;encrypt=false;trustServerCertificate=true;";
        
        try {
            java.sql.Connection conn = java.sql.DriverManager.getConnection(url);
            System.out.println("SUCCESS_JDBC!!!");
            conn.close();
            System.exit(0);
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void handle(Socket client, String pipeName) {
        try {
            RandomAccessFile pipe = new RandomAccessFile(pipeName, "rw");
            InputStream clientIn = client.getInputStream();
            OutputStream clientOut = client.getOutputStream();
            
            Thread outThread = new Thread(() -> {
                try {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = clientIn.read(buf)) != -1) {
                        pipe.write(buf, 0, len);
                    }
                } catch (Exception e) {
                    try { pipe.close(); } catch (Exception ex) {}
                }
            });
            outThread.setDaemon(true);
            outThread.start();
            
            Thread inThread = new Thread(() -> {
                try {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = pipe.read(buf)) != -1) {
                        clientOut.write(buf, 0, len);
                    }
                } catch (Exception e) {
                    try { client.close(); } catch (Exception ex) {}
                }
            });
            inThread.setDaemon(true);
            inThread.start();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
