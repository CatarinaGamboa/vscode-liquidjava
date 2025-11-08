import java.io.File;
import java.net.URI;
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

public class LJDiagnosticsService implements TextDocumentService, WorkspaceService {
    private LanguageClient client;
    private Set<String> checkedUris = new HashSet<>();

    /**
     * Checks diagnostics for the given URI and publishes them to the client
     * Before publishing new diagnostics, it clears previous diagnostics to
     * avoid inconsistent diagnostics in the editor
     * @param uri
     */
    public void checkDiagnostics(String uri) {
        if (this.client == null) {
            System.out.println("Language client not initialized — cannot publish diagnostics");
            return;
        }
        // clear previous diagnostics
        this.checkedUris.forEach(checkedUri -> this.client.publishDiagnostics(LJDiagnostics.getEmptyDiagnostics(checkedUri)));
        this.checkedUris.clear();

        // generate new diagnostics
        PublishDiagnosticsParams params = LJDiagnostics.generateDiagnostics(uri);
        this.client.publishDiagnostics(params);
        this.checkedUris.add(params.getUri());
    }

    /**
     * Sets the language client
     * @param client
     */
    public void setClient(LanguageClient client) {
        this.client = client;
    }

    /**
     * Checks diagnostics when a document is opened
     * @param params
     */
    @Override
    public void didOpen(DidOpenTextDocumentParams params) {
        System.out.println("Document opened — checking diagnostics");
        checkDiagnostics(params.getTextDocument().getUri());
    }

    /**
     * Checks diagnostics when a document is saved
     * @param params
     */
    @Override
    public void didSave(DidSaveTextDocumentParams params) {
        System.out.println("Document saved — checking diagnostics");
        checkDiagnostics(params.getTextDocument().getUri());
    }

    @Override
    public void didClose(DidCloseTextDocumentParams params) {
        String uri = params.getTextDocument().getUri();
        try {
            // check if the file still exists on disk
            File file = new File(new URI(uri));
            if (!file.exists()) {
                System.out.println("File deleted — clearing diagnostics");
                this.client.publishDiagnostics(LJDiagnostics.getEmptyDiagnostics(uri));
                this.checkedUris.remove(uri);
            }
        } catch (Exception e) {
            System.out.println("Error checking if file exists: " + e.getMessage());
        }
    }

    @Override
    public void didChange(DidChangeTextDocumentParams params) {
        // do nothing, diagnostics are checked on save to avoid excessive checks
    }

    @Override
    public void didChangeConfiguration(DidChangeConfigurationParams params) {
        // do nothing, ignore
    }

    @Override
    public void didChangeWatchedFiles(DidChangeWatchedFilesParams params) {
        // do nothing, ignore
    }
}