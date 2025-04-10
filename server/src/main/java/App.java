import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.launch.LSPLauncher;
import org.eclipse.lsp4j.services.LanguageClient;

public class App {

    public static void main(String[] args) throws Exception {
        if (args.length > 0) {
            int port = Integer.parseInt(args[0]);
            String os = args[1];
            new App().startNetworkedLanguageServer(port);
        } else {
            new App().startNetworkedLanguageServer(50000);
        }
    }

    private void startNetworkedLanguageServer(int port) {
        System.out.println("Starting listening in Network Server in " + port);

        try {
            final ServerSocket serversocket = new ServerSocket(port);
            new Thread(() -> {
                while (true) {
                    try {
                        System.out.println("Ready");
                        Socket socket = serversocket.accept();
                        if (socket != null) {
                            InputStream in = socket.getInputStream();
                            OutputStream out = socket.getOutputStream();

                            LJLanguageServer server = new LJLanguageServer();
                            Launcher<LanguageClient> launcher = LSPLauncher.createServerLauncher(server, in, out);
                            server.connect(launcher.getRemoteProxy(), launcher.getRemoteEndpoint());

                            launcher.startListening();
                        }
                    } catch (IOException e) {
                        System.out.println("Caught error here: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            }).start();
        } catch (IOException e) {
            System.out.println("Error:" + e.getMessage());
            e.printStackTrace();
        }

    }
}
