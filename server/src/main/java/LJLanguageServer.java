import java.util.concurrent.CompletableFuture;

import org.eclipse.lsp4j.CompletionOptions;
import org.eclipse.lsp4j.InitializeParams;
import org.eclipse.lsp4j.InitializeResult;
import org.eclipse.lsp4j.ServerCapabilities;
import org.eclipse.lsp4j.TextDocumentSyncKind;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.LanguageClientAware;
import org.eclipse.lsp4j.services.LanguageServer;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

public class LJLanguageServer implements LanguageServer, LanguageClientAware{

	private LanguageClient client = null;
	
    private TextDocumentService textDocumentService;
    private WorkspaceService workspaceService;
    @SuppressWarnings("unused")
    private String workspaceRoot = null;
    private int errorCode = 1;
    
    public LJLanguageServer() {
    	 this.textDocumentService = new LJTextDocumentService();
         this.workspaceService = new LJWorkspaceService();
    }
	
	public void connect(LanguageClient client) {
		 this.client = client;
	}

	public CompletableFuture<InitializeResult> initialize(InitializeParams params) {
		workspaceRoot = params.getRootPath();

        ServerCapabilities capabilities = new ServerCapabilities();
        capabilities.setTextDocumentSync(TextDocumentSyncKind.Full);
        capabilities.setCodeActionProvider(false);
        capabilities.setCompletionProvider(new CompletionOptions(true, null));

        return CompletableFuture.completedFuture(new InitializeResult(capabilities));
	}

	public CompletableFuture<Object> shutdown() {
		return CompletableFuture.completedFuture(null);
	}

	public void exit() {
		// TODO Auto-generated method stub
		System.exit(errorCode);
	}

	public TextDocumentService getTextDocumentService() {
		// TODO Auto-generated method stub
		return null;
	}

	public WorkspaceService getWorkspaceService() {
		// TODO Auto-generated method stub
		return null;
	}

}
