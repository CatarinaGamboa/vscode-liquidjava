import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;

import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.launch.LSPLauncher;
import org.eclipse.lsp4j.services.LanguageClient;

public class Main {

	  public static void main(String[] args) {

	        String port = args[0];
	        try {
	            Socket socket = new Socket("localhost", Integer.parseInt(port));
	           
	            InputStream in = socket.getInputStream();
	            OutputStream out = socket.getOutputStream();

	            LJLanguageServer server = new LJLanguageServer();
	            
	            Launcher<LanguageClient> launcher = LSPLauncher.createServerLauncher(server, in, out);
	            LanguageClient client = launcher.getRemoteProxy();
	            server.connect(client);

	            launcher.startListening();
	            System.out.println("Listening at port "+ port);
	        } catch (IOException e) {
	            e.printStackTrace();
	        }
	    }
}
