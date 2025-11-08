import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.xml.transform.Source;

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
    private static final String SOURCE = "liquidjava";

    /**
     * Generates diagnostics for the given URI
     * @param uri
     * @return PublishDiagnosticsParams
     */
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

    /**
     * Generates error diagnostics from the given ErrorEmitter
     * @param ee
     * @param uri
     * @return PublishDiagnosticsParams
     */
    public static PublishDiagnosticsParams getErrorDiagnostics(ErrorEmitter ee, String uri) {
        PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();

        // create diagnostic
        Range range = getRangeFromErrorPosition(ee.getPosition());
        String error = "Refinement Error"; // TODO: get from ee
        String message = String.format("%s: %s", error, ee.getTitleMessage());
        Diagnostic diagnostic = new Diagnostic(range, message, DiagnosticSeverity.Error, SOURCE);
        LJDiagnostic data = new LJDiagnostic(ee.getTitleMessage(), ee.getFullMessage(), error);
        diagnostic.setData(data);

        // add diagnostic to params
        List<Diagnostic> diagnostics = new ArrayList<>();
        diagnostics.add(diagnostic);
        diagnosticsParams.setDiagnostics(diagnostics);
        diagnosticsParams.setUri(ee.getFilePath().toString());
        return diagnosticsParams;
    }

    /**
     * Generates empty diagnostics for the given URI
     * @param uri
     * @return PublishDiagnosticsParams
     */
    public static PublishDiagnosticsParams getEmptyDiagnostics(String uri) {
        return new PublishDiagnosticsParams(uri, Collections.emptyList());
    }

    /**
     * Extracts the base path from the given full path
     * file://path/to/project/src/main/path/to/File.java => /path/to/project/src/main
     * @param fullPath
     * @return base path
     */
    private static String extractBasePath(String fullPath) {
        fullPath = fullPath.replace(FILE_PREFIX, "");
        int suffixIndex = fullPath.indexOf(SRC_SUFFIX);
        int nextSlashIndex = fullPath.indexOf("/", suffixIndex + SRC_SUFFIX.length());
        if (suffixIndex == -1 || nextSlashIndex == -1) return fullPath; // cannot extract base path
        return fullPath.substring(0, nextSlashIndex); // up to and including the next slash after /src/
    }

    /**
     * Converts a UTF-8 encoded string to a regular string
     * @param source
     * @return converted string
     */
    private static String convertUTFtoCharacters(String source) {
        try {
            return java.net.URLDecoder.decode(source, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException e) {
            // not going to happen - value came from JDK's own StandardCharsets
            return null;
        }
    }

    /**
     * Gets the Range from the given ErrorPosition
     * If the position is null, returns a default Range at (0,0)-(0,0)
     * @param pos
     * @return Range
     */
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
