import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.eclipse.lsp4j.Diagnostic;
import org.eclipse.lsp4j.DiagnosticSeverity;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.Range;
import liquidjava.api.CommandLineLauncher;
import liquidjava.diagnostics.ErrorEmitter;
import liquidjava.diagnostics.ErrorPosition;

public class LJDiagnostics {

    private static final String source = "liquidjava";

    public static class DiagnosticData {
        public String titleMessage;
        public String fullMessage;

        public DiagnosticData(String titleMessage, String fullMessage) {
            this.titleMessage = titleMessage;
            this.fullMessage = fullMessage;
        }
    }

    public static Optional<PublishDiagnosticsParams> checkDiagnostics(String root, String uri) {
        return verify(root, uri);
    }

    public static Optional<PublishDiagnosticsParams> verify(String root, String uri) {
        String url = extractPath(uri) + "/";// root.substring(7);
        System.out.println("TESTING IN VERIFY");
        System.out.println("uri:" + uri);
        url = convertUTFtoCharacters(url);
        System.out.println("url in lsp: " + url);
        ErrorEmitter ee;
        try {
            ee = CommandLineLauncher.launch(url);
            System.out.println(ee.foundError() ? "Liquidjava error found" : "Liquidjava error not found");
        } catch (Exception e) {
            System.err.println("Exception:" + e.getMessage());
            return Optional.empty();
        }
        System.out.println("ee:" + ee.getFullMessage());
        System.out.println("OnVerification");
        return generateDiagnostics(ee, uri);
    }

    private static Optional<PublishDiagnosticsParams> generateDiagnostics(ErrorEmitter ee, String uri) {
        if (!ee.foundError()) {
            PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
            diagnosticsParams.setDiagnostics(new ArrayList<>()); // empty
            diagnosticsParams.setUri(uri);
            return Optional.of(diagnosticsParams);
        }
        ErrorPosition pos = ee.getPosition();
        PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
        List<Diagnostic> diagnostics = new ArrayList<>();
        Range range = new Range(
            new Position(pos.getLineStart() - 1, pos.getColStart() - 1),
            new Position(pos.getLineEnd() - 1, pos.getColEnd() - 1)
        );
        String msg = String.format("Refinement Type Error\n%s", ee.getTitleMessage());
        Diagnostic diagnostic = new Diagnostic(range, msg, DiagnosticSeverity.Error, source);
        DiagnosticData data = new DiagnosticData(ee.getTitleMessage(), ee.getFullMessage());
        diagnostic.setData(data);
        diagnostics.add(diagnostic);
        diagnosticsParams.setDiagnostics(diagnostics);
        diagnosticsParams.setUri(ee.getFilePath().toString());
        return Optional.of(diagnosticsParams);
    }

    public static String extractPath(String path) {
        // Remove the file:// prefix
        String withoutPrefix = path.replace("file://", "");
        // Find the position of "/src/" in the path
        int srcIndex = withoutPrefix.indexOf("/src/");
        if (srcIndex == -1) {
            return withoutPrefix; // Return the whole path if "/src/" is not found
        }
        // Find the position of the next "/" after "/src/"
        int nextSlashIndex = withoutPrefix.indexOf("/", srcIndex + 5); // +5 because "/src/" is 5 characters
        if (nextSlashIndex == -1) {
            return withoutPrefix; // Return the whole path if there's no folder after src
        }
        // Extract the path from the beginning up to and including the folder after src
        return withoutPrefix.substring(0, nextSlashIndex);
    }

    private static String convertUTFtoCharacters(String source) {
        try {
            return java.net.URLDecoder.decode(source, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException e) {
            // not going to happen - value came from JDK's own StandardCharsets
            return null;
        }
    }
}
