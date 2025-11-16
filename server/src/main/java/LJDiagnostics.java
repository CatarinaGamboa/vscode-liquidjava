import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.eclipse.lsp4j.Diagnostic;
import org.eclipse.lsp4j.DiagnosticSeverity;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.Range;
import liquidjava.api.CommandLineLauncher;
import liquidjava.diagnostics.Diagnostics;
import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.LJDiagnostic;

public class LJDiagnostics {

    private static final String FILE_PREFIX = "file://";
    private static final String SRC_SUFFIX = "/src/";
    private static final String SOURCE = "liquidjava";

    /**
     * Generates diagnostics for the given URI
     * @param uri the uri used for the verification
     * @return diagnostics
     */
    public static List<PublishDiagnosticsParams> generateDiagnostics(String uri) {
        List<PublishDiagnosticsParams> result = new ArrayList<>();
        try {
            String path = convertUTFtoCharacters(extractBasePath(uri));
            CommandLineLauncher.launch(path);
            Diagnostics diagnostics = Diagnostics.getInstance();
            
            if (diagnostics.foundError()) {
                System.out.println("Failed verification");
                List<LJDiagnostic> errors = new ArrayList<>(diagnostics.getErrors());
                result.addAll(getDiagnostics(errors, DiagnosticSeverity.Error));
            } else {
                System.out.println("Passed verification");
            }
            if (diagnostics.foundWarning()) {
                List<LJDiagnostic> warnings = new ArrayList<>(diagnostics.getWarnings());
                result.addAll(getDiagnostics(warnings, DiagnosticSeverity.Warning));
            }
            return result.isEmpty() ? List.of(getEmptyDiagnostics(uri)) : result;
        } catch (Exception e) {
            System.err.println("Exception:" + e.getMessage());
            return result;
        }
    }

    /**
     * Generates error and warning diagnostics
     * @return diagnostics
     */
    public static List<PublishDiagnosticsParams> getDiagnostics(List<LJDiagnostic> diagnostics,
            DiagnosticSeverity severity) {
        // group diagnostics by file
        Map<String, List<Diagnostic>> diagnosticsByFile = diagnostics.stream()
            .collect(Collectors.groupingBy(
                d -> FILE_PREFIX + d.getFile(),
                Collectors.mapping(d -> {
                    Range range = getRangeFromErrorPosition(d.getPosition());
                    String message = String.format("%s: %s", d.getTitle(), d.getMessage());
                    return new Diagnostic(range, message, severity, SOURCE);
                }, Collectors.toList())
            ));
        
        // create a PublishDiagnosticsParams per file with all its diagnostics
        return diagnosticsByFile.entrySet().stream()
            .map(entry -> new PublishDiagnosticsParams(entry.getKey(), entry.getValue()))
            .toList();
    }

    /**
     * Generates empty diagnostics for the given URI
     * @param uri the uri used for the verification
     * @return PublishDiagnosticsParams
     */
    public static PublishDiagnosticsParams getEmptyDiagnostics(String uri) {
        return new PublishDiagnosticsParams(uri, Collections.emptyList());
    }

    /**
     * Extracts the base path from the given full path
     * e.g. file://path/to/project/src/main/path/to/File.java => /path/to/project/src/main
     * @param fullPath the full path
     * @return base path
     */
    private static String extractBasePath(String fullPath) {
        fullPath = fullPath.replace(FILE_PREFIX, "");
        int suffixIndex = fullPath.indexOf(SRC_SUFFIX);
        int nextSlashIndex = fullPath.indexOf("/", suffixIndex + SRC_SUFFIX.length());
        if (suffixIndex == -1 || nextSlashIndex == -1)
            return fullPath; // cannot extract base path
        return fullPath.substring(0, nextSlashIndex); // up to and including the next slash after /src/
    }

    /**
     * Converts a UTF-8 encoded string to a regular string
     * @param source the UTF-8 encoded string
     * @return converted string
     */
    private static String convertUTFtoCharacters(String source) {
        return java.net.URLDecoder.decode(source, StandardCharsets.UTF_8);
    }

    /**
     * Gets the Range from the given ErrorPosition If the position is null, returns a default Range at (0,0)-(0,0)
     * @param pos the ErrorPosition
     * @return Range
     */
    private static Range getRangeFromErrorPosition(ErrorPosition pos) {
        if (pos == null) {
            // no location information available
            return new Range(new Position(0, 0), new Position(0, 0));
        }
        return new Range(new Position(pos.getLineStart() - 1, pos.getColStart() - 1),
                new Position(pos.getLineEnd() - 1, pos.getColEnd() - 1));
    }
}
