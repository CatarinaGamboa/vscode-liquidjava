

package dtos;

import dtos.diagnostics.LJDiagnosticDTO;
import dtos.errors.CustomErrorDTO;
import dtos.errors.GhostInvocationErrorDTO;
import dtos.errors.IllegalConstructorTransitionErrorDTO;
import dtos.errors.InvalidRefinementErrorDTO;
import dtos.errors.LJErrorDTO;
import dtos.errors.NotFoundErrorDTO;
import dtos.errors.RefinementErrorDTO;
import dtos.errors.StateConflictErrorDTO;
import dtos.errors.StateRefinementErrorDTO;
import dtos.errors.SyntaxErrorDTO;
import dtos.warnings.ExternalClassNotFoundWarningDTO;
import dtos.warnings.ExternalMethodNotFoundWarningDTO;
import dtos.warnings.LJWarningDTO;
import liquidjava.diagnostics.LJDiagnostic;
import liquidjava.diagnostics.errors.CustomError;
import liquidjava.diagnostics.errors.GhostInvocationError;
import liquidjava.diagnostics.errors.IllegalConstructorTransitionError;
import liquidjava.diagnostics.errors.InvalidRefinementError;
import liquidjava.diagnostics.errors.LJError;
import liquidjava.diagnostics.errors.NotFoundError;
import liquidjava.diagnostics.errors.RefinementError;
import liquidjava.diagnostics.errors.StateConflictError;
import liquidjava.diagnostics.errors.StateRefinementError;
import liquidjava.diagnostics.errors.SyntaxError;
import liquidjava.diagnostics.warnings.ExternalClassNotFoundWarning;
import liquidjava.diagnostics.warnings.ExternalMethodNotFoundWarning;
import liquidjava.diagnostics.warnings.LJWarning;

/**
 * Utility class for converting LiquidJava diagnostic objects to their corresponding DTOs.
 * This ensures proper serialization by avoiding complex objects like File references.
 */
public class DiagnosticConverter {

    /**
     * Converts a diagnostic to its appropriate DTO type
     * @param diagnostic the diagnostic to convert
     * @return the corresponding DTO
     */
    public static Object convertToDTO(LJDiagnostic diagnostic) {
        // Handle specific error types
        if (diagnostic instanceof RefinementError) {
            return RefinementErrorDTO.from((RefinementError) diagnostic);
        } else if (diagnostic instanceof StateRefinementError) {
            return StateRefinementErrorDTO.from((StateRefinementError) diagnostic);
        } else if (diagnostic instanceof SyntaxError) {
            return SyntaxErrorDTO.from((SyntaxError) diagnostic);
        } else if (diagnostic instanceof CustomError) {
            return CustomErrorDTO.from((CustomError) diagnostic);
        } else if (diagnostic instanceof GhostInvocationError) {
            return GhostInvocationErrorDTO.from((GhostInvocationError) diagnostic);
        } else if (diagnostic instanceof InvalidRefinementError) {
            return InvalidRefinementErrorDTO.from((InvalidRefinementError) diagnostic);
        } else if (diagnostic instanceof StateConflictError) {
            return StateConflictErrorDTO.from((StateConflictError) diagnostic);
        } else if (diagnostic instanceof NotFoundError) {
            return NotFoundErrorDTO.from((NotFoundError) diagnostic);
        } else if (diagnostic instanceof IllegalConstructorTransitionError) {
            return IllegalConstructorTransitionErrorDTO.from((IllegalConstructorTransitionError) diagnostic);
        } else if (diagnostic instanceof ExternalClassNotFoundWarning) {
            return ExternalClassNotFoundWarningDTO.from((ExternalClassNotFoundWarning) diagnostic);
        } else if (diagnostic instanceof ExternalMethodNotFoundWarning) {
            return ExternalMethodNotFoundWarningDTO.from((ExternalMethodNotFoundWarning) diagnostic);
        } else if (diagnostic instanceof LJError) {
            return LJErrorDTO.from((LJError) diagnostic);
        } else if (diagnostic instanceof LJWarning) {
            return LJWarningDTO.from((LJWarning) diagnostic);
        } else {
            // Generic fallback
            return LJDiagnosticDTO.from(diagnostic);
        }
    }
}
