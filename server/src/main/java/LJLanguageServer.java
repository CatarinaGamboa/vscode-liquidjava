import java.io.File;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.eclipse.lsp4j.InitializeParams;
import org.eclipse.lsp4j.InitializeResult;
import org.eclipse.lsp4j.ServerCapabilities;
import org.eclipse.lsp4j.TextDocumentSyncKind;
import org.eclipse.lsp4j.WorkspaceFolder;
import org.eclipse.lsp4j.WorkspaceFoldersOptions;
import org.eclipse.lsp4j.WorkspaceServerCapabilities;
import org.eclipse.lsp4j.jsonrpc.RemoteEndpoint;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.LanguageServer;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

public class LJLanguageServer implements LanguageServer {

    private LJTextDocumentService textDocumentService;


    private int errorCode = 1;

    public LJLanguageServer() {
        this.textDocumentService = new LJTextDocumentService();
    }

    public CompletableFuture<InitializeResult> initialize(InitializeParams params) {

        CompletableFuture<InitializeResult> completableFuture = new CompletableFuture<InitializeResult>();
        ServerCapabilities capabilities = new ServerCapabilities();
        WorkspaceServerCapabilities workspaceServerCapabilities = new WorkspaceServerCapabilities();
        WorkspaceFoldersOptions workspaceFoldersOptions = new WorkspaceFoldersOptions();
        workspaceFoldersOptions.setChangeNotifications(true);
        workspaceFoldersOptions.setSupported(true);
        workspaceServerCapabilities.setWorkspaceFolders(workspaceFoldersOptions);
        capabilities.setWorkspace(workspaceServerCapabilities);
        capabilities.setDocumentSymbolProvider(false);
        capabilities.setTextDocumentSync(TextDocumentSyncKind.Full);
        // More in:
        // https://github.com/nedap/archetype-languageserver/blob/24b0890c0f046c6c1af8269a5c9770a8860a96b3/src/main/java/com/nedap/openehr/lsp/ADL2LanguageServer.java
         capabilities.setDocumentLinkProvider(null);//new DocumentLinkOptions(true));
 
        completableFuture.complete(new InitializeResult(capabilities));

        // Primary approach: Use workspace folders
        List<WorkspaceFolder> workspaceFolders = params.getWorkspaceFolders();
        if (workspaceFolders != null && !workspaceFolders.isEmpty()) {
            String rootUri = workspaceFolders.get(0).getUri();
            System.err.println("rootUri:" + rootUri);
            textDocumentService.setWorkspaceRoot(rootUri);
        } else {
            // Fallback: Use rootPath and convert to URI if needed
            String rootPath = params.getRootPath();
            if (rootPath != null) {
                try {
                    String rootUri = new File(rootPath).toURI().toString();
                    System.err.println("rootUri:" + rootUri);
                    textDocumentService.setWorkspaceRoot(rootUri);
                } catch (Exception e) {
                    System.err.println("Failed to convert rootPath to URI: " + e.getMessage());
                }
            }
        }

        return completableFuture;
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
        textDocumentService.setRemoteProxy(remoteProxy);
    }
}
