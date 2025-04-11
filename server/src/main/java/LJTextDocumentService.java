import java.util.Optional;

import org.eclipse.lsp4j.DidChangeConfigurationParams;
import org.eclipse.lsp4j.DidChangeTextDocumentParams;
import org.eclipse.lsp4j.DidChangeWatchedFilesParams;
import org.eclipse.lsp4j.DidCloseTextDocumentParams;
import org.eclipse.lsp4j.DidOpenTextDocumentParams;
import org.eclipse.lsp4j.DidSaveTextDocumentParams;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.TextDocumentItem;
import org.eclipse.lsp4j.VersionedTextDocumentIdentifier;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

public class LJTextDocumentService implements TextDocumentService, WorkspaceService {
    private LanguageClient remoteProxy;
    private String workspaceRoot;

    public void setWorkspaceRoot(String s) {
        if (!s.contains("/src"))
            s = "/" + s + "src";
        // if(os.equals(os.UNIX))
        // s = "/"+s;
        System.out.println("workspace root:" + s);
        workspaceRoot = s;
    }

    public void checkDiagnostics(TextDocumentItem textDocumentItem) {
        Optional<PublishDiagnosticsParams> oparams = LJDiagnostics.checkDiagnostics(workspaceRoot, textDocumentItem);
        if (oparams.isPresent())
            remoteProxy.publishDiagnostics(oparams.get());
        else
            remoteProxy.publishDiagnostics(new PublishDiagnosticsParams());

    }

    private void checkDiagnostics(VersionedTextDocumentIdentifier textDocument) {
        Optional<PublishDiagnosticsParams> oparams = LJDiagnostics.checkDiagnostics(workspaceRoot, textDocument);
        if (oparams.isPresent())
            remoteProxy.publishDiagnostics(oparams.get());
        else
            remoteProxy.publishDiagnostics(null);

    }

    public void setRemoteProxy(LanguageClient remoteProxy) {
        this.remoteProxy = remoteProxy;
    }

    @Override
    public void didOpen(DidOpenTextDocumentParams params) {
        System.out.println("DEBUG:on didOpen - checking Diagnostics");
        // TODO Auto-generated method stub
        checkDiagnostics(params.getTextDocument());

    }

    @Override
    public void didChange(DidChangeTextDocumentParams params) {
        System.out.println("DEBUG:on didOpen - checking Diagnostics");
        System.out.println();
        checkDiagnostics(params.getTextDocument());
    }

    // ---------------- All TODO after this line -----------------
    @Override
    public void didChangeConfiguration(DidChangeConfigurationParams params) {
        System.out.println("DEBUG:on didChangeConfiguration");
        // TODO Auto-generated method stub
    }

    @Override
    public void didChangeWatchedFiles(DidChangeWatchedFilesParams params) {
        System.out.println("DEBUG:on didChangeWatchedFiles ");
        // TODO Auto-generated method stub
    }

    @Override
    public void didClose(DidCloseTextDocumentParams params) {
        // TODO Auto-generated method stub
        System.out.println("DEBUG:on didClose ");
    }

    @Override
    public void didSave(DidSaveTextDocumentParams params) {
        // TODO Auto-generated method stub
        System.out.println("DEBUG:on didSave ");

    }

}
