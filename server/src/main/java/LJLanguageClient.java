import java.util.List;

import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.jsonrpc.services.JsonNotification;

import dtos.LJDiagnosticDTO;

/**
 * Language client interface to specify custom notifications
 */
public interface LJLanguageClient extends LanguageClient {
    
    /**
     * Sends custom diagnostics notification to the client
     * @param diagnostics the LiquidJava diagnostics DTOs to send
     */
    @JsonNotification("liquidjava/diagnostics")
    void sendDiagnostics(List<LJDiagnosticDTO> diagnostics);
}
