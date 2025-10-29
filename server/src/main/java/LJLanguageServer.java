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
import org.eclipse.lsp4j.jsonrpc.services.JsonNotification;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.LanguageServer;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

public class LJLanguageServer implements LanguageServer {

    private LJTextDocumentService textDocumentService;

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
        capabilities.setDocumentLinkProvider(null); // new DocumentLinkOptions(true));
        // More in: https://github.com/nedap/archetype-languageserver/blob/24b0890c0f046c6c1af8269a5c9770a8860a96b3/src/main/java/com/nedap/openehr/lsp/ADL2LanguageServer.java

        completableFuture.complete(new InitializeResult(capabilities));

        // Workspace folders
        List<WorkspaceFolder> workspaceFolders = params.getWorkspaceFolders();
        if (workspaceFolders != null && !workspaceFolders.isEmpty()) {
            String rootUri = workspaceFolders.get(0).getUri();
            System.err.println("rootUri:" + rootUri);
            textDocumentService.setWorkspaceRoot(rootUri);
        }
        return completableFuture;
    }

    public CompletableFuture<Object> shutdown() {
        return CompletableFuture.completedFuture(null);
    }

    public void exit() {
        // TODO Auto-generated method stub
        System.exit(1);
    }

    public TextDocumentService getTextDocumentService() {
        return textDocumentService;
    }

    public WorkspaceService getWorkspaceService() {
        return textDocumentService;
    }

    public void connect(LanguageClient remoteProxy, RemoteEndpoint remoteEndpoint) {
        textDocumentService.setClient(remoteProxy);
    }

    @JsonNotification("$/setTraceNotification")
    public void setTrace(Object params) {
        // suppress notification
    }
}
