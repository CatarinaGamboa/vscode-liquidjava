import java.util.Arrays;
import java.util.concurrent.CompletableFuture;

import org.eclipse.lsp4j.CodeLensOptions;
import org.eclipse.lsp4j.CompletionOptions;
import org.eclipse.lsp4j.DocumentLinkOptions;
import org.eclipse.lsp4j.InitializeParams;
import org.eclipse.lsp4j.InitializeResult;
import org.eclipse.lsp4j.ServerCapabilities;
import org.eclipse.lsp4j.TextDocumentSyncKind;
import org.eclipse.lsp4j.WorkspaceFoldersOptions;
import org.eclipse.lsp4j.WorkspaceServerCapabilities;
import org.eclipse.lsp4j.jsonrpc.RemoteEndpoint;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.LanguageClientAware;
import org.eclipse.lsp4j.services.LanguageServer;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

import com.google.common.collect.Lists;

public class LJLanguageServer implements LanguageServer{
	
	
    private InitializeParams clientParams;
    private LJTextDocumentService textDocumentService;
    private LanguageClient remoteProxy;
    private RemoteEndpoint remoteEndpoint;


	
//
//	private LanguageClient client = null;
//    @SuppressWarnings("unused")
//    private String workspaceRoot = null;
//    private WorkspaceService workspaceService;
    private int errorCode = 1;
    
    public LJLanguageServer() {
    	 this.textDocumentService = new LJTextDocumentService();
//         this.workspaceService = new LJWorkspaceService();
    }
	

	public CompletableFuture<InitializeResult> initialize(InitializeParams params) {
		  this.clientParams = params;

	        CompletableFuture<InitializeResult> completableFuture = new CompletableFuture<InitializeResult>();
	        ServerCapabilities capabilities = new ServerCapabilities();
	        WorkspaceServerCapabilities workspaceServerCapabilities = new WorkspaceServerCapabilities();
	        WorkspaceFoldersOptions workspaceFoldersOptions = new WorkspaceFoldersOptions();
	        workspaceFoldersOptions.setChangeNotifications(true);
	        workspaceFoldersOptions.setSupported(true);
	        workspaceServerCapabilities.setWorkspaceFolders(workspaceFoldersOptions);
	        capabilities.setWorkspace(workspaceServerCapabilities);
	        capabilities.setDocumentSymbolProvider(true);
	        capabilities.setTextDocumentSync(TextDocumentSyncKind.Full);
	        //More in:
	        //https://github.com/nedap/archetype-languageserver/blob/24b0890c0f046c6c1af8269a5c9770a8860a96b3/src/main/java/com/nedap/openehr/lsp/ADL2LanguageServer.java
//	        capabilities.setFoldingRangeProvider(true);
	        capabilities.setHoverProvider(true);
	        capabilities.setCodeLensProvider(new CodeLensOptions(false));//no resolve provider for now
	        capabilities.setDocumentLinkProvider(new DocumentLinkOptions(true));

	        capabilities.setCompletionProvider(new CompletionOptions(false, Lists.newArrayList("cc")));//add '/' to trigger code completion on paths as well as the usual things.


//	        capabilities.setCodeActionProvider(new CodeActionOptions(Lists.newArrayList(
//	                ADL2TextDocumentService.ADL2_COMMAND,
//	                ADL2TextDocumentService.ALL_ADL2_COMMAND,
//	                ADL2TextDocumentService.ADD_TO_TERMINOLOGY,
//	                ADL2TextDocumentService.WRITE_OPT_ADL,
//	                ADL2TextDocumentService.WRITE_OPT_JSON,
//	                ADL2TextDocumentService.WRITE_OPT_XML,
//	                ADL2TextDocumentService.WRITE_EXAMPLE_JSON,
//	                ADL2TextDocumentService.WRITE_EXAMPLE_FLAT_JSON,
//	                ADL2TextDocumentService.WRITE_EXAMPLE_XML
//	        )));
//	        capabilities.setExecuteCommandProvider(new ExecuteCommandOptions(Lists.newArrayList(
//	                ADL2TextDocumentService.ADL2_COMMAND,
//	                ADL2TextDocumentService.ALL_ADL2_COMMAND,
//	                ADL2TextDocumentService.ADD_TO_TERMINOLOGY,
//	                ADL2TextDocumentService.WRITE_OPT_COMMAND,
//	                ADL2TextDocumentService.WRITE_EXAMPLE_COMMAND,
//	                ADL2TextDocumentService.SHOW_INFO_COMMAND
//	                )));

//	        ServerInfo serverInfo = new ServerInfo();
//	        serverInfo.setName("ADL 2 Archetype language server");
//	        serverInfo.setVersion("0.0.1-alpha");
	        completableFuture.complete(new InitializeResult(capabilities));
	        System.err.println(params.getRootUri());
//	        System.err.println(params.getWorkspaceFolders());
	        
	        return completableFuture;
		
		
//		workspaceRoot = params.getRootPath();
//
//        ServerCapabilities capabilities = new ServerCapabilities();
//        capabilities.setTextDocumentSync(TextDocumentSyncKind.Full);
//        capabilities.setCodeActionProvider(false);
//        capabilities.setCompletionProvider(new CompletionOptions(true, Arrays.asList("x")));
//
//        return CompletableFuture.completedFuture(new InitializeResult(capabilities));
	}

	public CompletableFuture<Object> shutdown() {
		return CompletableFuture.completedFuture(null);
	}

	public void exit() {
		// TODO Auto-generated method stub
		System.exit(errorCode);
	}

	public TextDocumentService getTextDocumentService() {
		return textDocumentService;
	}

	public WorkspaceService getWorkspaceService() {
		return textDocumentService;
	}

	
	 public void connect(LanguageClient remoteProxy, RemoteEndpoint remoteEndpoint) {
	        this.remoteProxy = remoteProxy;
	        this.remoteEndpoint = remoteEndpoint;
	        textDocumentService.setRemoteProxy(remoteProxy);
	        textDocumentService.setRemoteEndPoint(remoteEndpoint);
	    }
}
