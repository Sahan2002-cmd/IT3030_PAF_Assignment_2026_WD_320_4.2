import java.sql.Connection;
import java.sql.DriverManager;

public class TestJdbc {
    public static void main(String[] args) throws Exception {
        Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        
        String url = "jdbc:sqlserver://localhost:14330;databaseName=smart_campus;integratedSecurity=true;encrypt=false;trustServerCertificate=true;";
        System.out.println("Testing: " + url);
        try {
            Connection conn = DriverManager.getConnection(url);
            System.out.println("SUCCESS!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
