import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.ServerSocket;
import java.net.Socket;

public class TestProxy {
    public static void main(String[] args) throws Exception {
        String pipeName = "\\\\.\\pipe\\LOCALDB#4350F2F2\\tsql\\query";
        
        System.out.println("Starting TCP Proxy on port 1433 for " + pipeName);
        try (ServerSocket server = new ServerSocket(1433)) {
            System.out.println("Listening...");
            while (true) {
                Socket client = server.accept();
                System.out.println("Accepted connection!");
                new Thread(() -> handle(client, pipeName)).start();
            }
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
                } catch (Exception e) {}
            });
            outThread.start();
            
            byte[] buf = new byte[8192];
            int len;
            while ((len = pipe.read(buf)) != -1) {
                clientOut.write(buf, 0, len);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
