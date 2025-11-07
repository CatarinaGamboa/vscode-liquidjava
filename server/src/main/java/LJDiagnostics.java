import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.eclipse.lsp4j.Diagnostic;
import org.eclipse.lsp4j.DiagnosticSeverity;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.Range;
import liquidjava.api.CommandLineLauncher;
import liquidjava.diagnostics.ErrorEmitter;
import liquidjava.diagnostics.ErrorPosition;

public class LJDiagnostics {

    private static final String FILE_PREFIX = "file://";
    private static final String SRC_SUFFIX = "/src/";

    public static PublishDiagnosticsParams generateDiagnostics(String uri) {
        try {
            String path = convertUTFtoCharacters(extractBasePath(uri));
            ErrorEmitter ee = CommandLineLauncher.launch(path);
            if (!ee.foundError()) {
                System.out.println("Passed verification");
                return getEmptyDiagnostics(uri);
            } else {
                System.out.println("Failed verification");
                System.out.println("Error at: " + ee.getFilePath() + "\n" + ee.getFullMessage());
                return getErrorDiagnostics(ee, uri);
            }
        } catch (Exception e) {
            System.err.println("Exception:" + e.getMessage());
            return getEmptyDiagnostics(uri);
        }
    }

    public static PublishDiagnosticsParams getErrorDiagnostics(ErrorEmitter ee, String uri) {
        PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
        Range range = getRangeFromErrorPosition(ee.getPosition());
        String msg = ee.getTitleMessage() + "\n" + ee.getFullMessage();
        List<Diagnostic> diagnostics = new ArrayList<>();
        diagnostics.add(new Diagnostic(range, "Refinement Type Error", DiagnosticSeverity.Error, msg));
        diagnosticsParams.setDiagnostics(diagnostics);
        diagnosticsParams.setUri(ee.getFilePath().toString());
        return diagnosticsParams;
    }

    public static PublishDiagnosticsParams getEmptyDiagnostics(String uri) {
        return new PublishDiagnosticsParams(uri, Collections.emptyList());
    }

    private static String extractBasePath(String fullPath) {
        fullPath = fullPath.replace(FILE_PREFIX, "");
        int suffixIndex = fullPath.indexOf(SRC_SUFFIX);
        int nextSlashIndex = fullPath.indexOf("/", suffixIndex + SRC_SUFFIX.length());
        if (suffixIndex == -1 || nextSlashIndex == -1) return fullPath; // cannot extract base path
        return fullPath.substring(0, nextSlashIndex); // up to and including the next slash after /src/
    }

    private static String convertUTFtoCharacters(String source) {
        try {
            return java.net.URLDecoder.decode(source, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException e) {
            // not going to happen - value came from JDK's own StandardCharsets
            return null;
        }
    }

    private static Range getRangeFromErrorPosition(ErrorPosition pos) {
        if (pos == null) {
            // no location information available
            return new Range(new Position(0, 0), new Position(0, 0));
        }
        return new Range(
            new Position(pos.getLineStart() - 1, pos.getColStart() - 1),
            new Position(pos.getLineEnd() - 1, pos.getColEnd() - 1)
        );
    }
}
