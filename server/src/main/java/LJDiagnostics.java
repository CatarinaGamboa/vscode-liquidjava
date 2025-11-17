import java.util.List;

import liquidjava.diagnostics.errors.LJError;
import liquidjava.diagnostics.warnings.LJWarning;

public record LJDiagnostics(List<LJError> errors, List<LJWarning> warnings) {}