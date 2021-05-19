import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;

import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.launch.LSPLauncher;
import org.eclipse.lsp4j.services.LanguageClient;

public class Main {

	public static void main(String[] args) {
		if(args.length > 0) {
			new Main().startNetworkedLanguageServer();
		} else {
			new Main().startCommandLineServer();
		}

		//		  System.out.println("Entered in server");
		//	        String port = "50000";//args[0];
		//	        try {
		//	            Socket socket = new Socket("localhost", 50000);//Integer.parseInt(port)
		//	            
		//	            InputStream in = socket.getInputStream();
		//	            OutputStream out = socket.getOutputStream();
		//
		//	            LJLanguageServer server = new LJLanguageServer();
		//	            
		//				PrintWriter pw = new PrintWriter(new File("log.txt"));
		//	            Launcher<LanguageClient> launcher = LSPLauncher.createServerLauncher(server, in, out, false, pw);
		//	            LanguageClient client = launcher.getRemoteProxy();
		//	            server.connect(client);
		//
		//	            launcher.startListening();
		//	            System.out.println("Listening at port "+ port);
		//	        } catch (IOException e) {
		//	            e.printStackTrace();
		//	        }
	}

	private void startCommandLineServer() {
		System.out.println("Starting listening in CLServer");
		InputStream in = System.in;
		OutputStream out = System.out;

		LJLanguageServer server = new LJLanguageServer();
		Launcher<LanguageClient> launcher = LSPLauncher.createServerLauncher(server, in, out);
		server.connect(launcher.getRemoteProxy(), launcher.getRemoteEndpoint());
		launcher.startListening();

	}

	private void startNetworkedLanguageServer() {
		System.out.println("Starting listening in Network Server");
		int port = 50000;
		try {
			final ServerSocket serversocket = new ServerSocket(port);
			new Thread( () -> {
				while(true) {
					try {
						Socket socket = serversocket.accept();
						System.out.println("Accepted incoming");
						if(socket != null) {
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
			e.printStackTrace();
		}

	}
}
