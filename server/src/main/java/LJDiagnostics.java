import java.util.List;

import liquidjava.diagnostics.errors.LJError;
import liquidjava.diagnostics.warnings.LJWarning;

/**
 * Container for LiquidJava diagnostics after verification
 */
public record LJDiagnostics(List<LJError> errors, List<LJWarning> warnings) {}