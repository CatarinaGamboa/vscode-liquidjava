import java.util.Collections;
import java.util.Optional;

import org.eclipse.lsp4j.DidChangeConfigurationParams;
import org.eclipse.lsp4j.DidChangeTextDocumentParams;
import org.eclipse.lsp4j.DidChangeWatchedFilesParams;
import org.eclipse.lsp4j.DidCloseTextDocumentParams;
import org.eclipse.lsp4j.DidOpenTextDocumentParams;
import org.eclipse.lsp4j.DidSaveTextDocumentParams;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

public class LJTextDocumentService implements TextDocumentService, WorkspaceService {
    private LanguageClient client;
    private String workspaceRoot;

    public void setWorkspaceRoot(String root) {
        if (!root.contains("/src")) root = "/" + root + "src";
        // if(os.equals(os.UNIX)) s = "/"+s;
        System.out.println("workspace root:" + root);
        workspaceRoot = root;
    }

    public void checkDiagnostics(String uri) {
        Optional<PublishDiagnosticsParams> optParams = LJDiagnostics.checkDiagnostics(workspaceRoot, uri);
        publishDiagnostics(optParams, uri);
    }

    private void publishDiagnostics(Optional<PublishDiagnosticsParams> optParams, String uri) {
        final PublishDiagnosticsParams params = optParams.orElse(new PublishDiagnosticsParams(uri, Collections.emptyList()));
        this.client.publishDiagnostics(params);
    }

    public void setClient(LanguageClient client) {
        this.client = client;
    }

    @Override
    public void didOpen(DidOpenTextDocumentParams params) {
        System.out.println("DEBUG:on didOpen - checking Diagnostics");
        checkDiagnostics(params.getTextDocument().getUri());
    }

    @Override
    public void didSave(DidSaveTextDocumentParams params) {
        System.out.println("DEBUG:on didSave - checking Diagnostics");
        checkDiagnostics(params.getTextDocument().getUri());
    }

    @Override
    public void didClose(DidCloseTextDocumentParams params) {
        // do nothing
    }

    @Override
    public void didChange(DidChangeTextDocumentParams params) {
        // do nothing
    }

    @Override
    public void didChangeConfiguration(DidChangeConfigurationParams params) {
        // do nothing
    }

    @Override
    public void didChangeWatchedFiles(DidChangeWatchedFilesParams params) {
        // do nothing
    }
}
