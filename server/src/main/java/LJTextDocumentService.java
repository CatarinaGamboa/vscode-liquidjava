import java.util.HashSet;
import java.util.Set;

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

    public void checkDiagnostics(String uri) {
        System.out.println("checkDiagnostics for: " + uri);

        // clear previous diagnostics
        for (String checkedUri : this.checkedUris) {
            this.client.publishDiagnostics(LJDiagnostics.getEmptyDiagnostics(checkedUri));
        }
        this.checkedUris.clear();

        // generate new diagnostics
        PublishDiagnosticsParams params = LJDiagnostics.generateDiagnostics(uri);
        this.client.publishDiagnostics(params);
        this.checkedUris.add(params.getUri());
    }

    public void setClient(LanguageClient client) {
        this.client = client;
    }

    @Override
    public void didOpen(DidOpenTextDocumentParams params) {
        System.out.println("Document opened — checking diagnostics");
        checkDiagnostics(params.getTextDocument().getUri());
    }

    @Override
    public void didSave(DidSaveTextDocumentParams params) {
        System.out.println("Document saved — checking diagnostics");
        checkDiagnostics(params.getTextDocument().getUri());
    }
    
    @Override
    public void didChangeWatchedFiles(DidChangeWatchedFilesParams params) {
        System.out.println("Watched files changed — checking diagnostics");
        for (var change : params.getChanges()) {
            checkDiagnostics(change.getUri());
        }
    }

    @Override
    public void didClose(DidCloseTextDocumentParams params) {
        System.out.println("Document closed — clearing diagnostics");
        String uri = params.getTextDocument().getUri();
        this.client.publishDiagnostics(LJDiagnostics.getEmptyDiagnostics(uri));
        this.checkedUris.remove(uri);
    }

    @Override
    public void didChange(DidChangeTextDocumentParams params) {
        // do nothing
        System.out.println("Document changed");
    }

    @Override
    public void didChangeConfiguration(DidChangeConfigurationParams params) {
        // do nothing
        System.out.println("Configuration changed");
    }

}