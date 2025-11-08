import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;

import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.launch.LSPLauncher;
import org.eclipse.lsp4j.services.LanguageClient;

public class App {

    final static int DEFAULT_PORT = 50000;

    public static void main(String[] args) throws Exception {
        final int port = args.length > 0 ? Integer.parseInt(args[0]) : DEFAULT_PORT;
        System.out.println("Starting server on port: " + port);
        new App().startNetworkedLanguageServer(port);
    }

    /**
     * Starts the language server on the given port in a new thread
     * @param port
     */
    private void startNetworkedLanguageServer(int port) {
        new Thread(() -> {
            try (ServerSocket serverSocket = new ServerSocket(port)) {
                while (true) {
                    try (Socket socket = serverSocket.accept()) {
                        InputStream in = socket.getInputStream();
                        OutputStream out = socket.getOutputStream();
                        LJLanguageServer server = new LJLanguageServer();
                        Launcher<LanguageClient> launcher = LSPLauncher.createServerLauncher(server, in, out);
                        server.connect(launcher.getRemoteProxy(), launcher.getRemoteEndpoint());
                        launcher.startListening();
                    } catch (IOException e) {
                        System.out.println("Error: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            } catch (IOException e) {
                System.out.println("Error: " + e.getMessage());
                e.printStackTrace();
            }
        }).start();
    }
}
