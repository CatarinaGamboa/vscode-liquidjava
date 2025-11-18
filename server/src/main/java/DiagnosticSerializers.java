

import java.lang.reflect.Type;

import com.google.gson.JsonElement;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

import dtos.CustomErrorDTO;
import dtos.ExternalClassNotFoundWarningDTO;
import dtos.ExternalMethodNotFoundWarningDTO;
import dtos.GhostInvocationErrorDTO;
import dtos.IllegalConstructorTransitionErrorDTO;
import dtos.InvalidRefinementErrorDTO;
import dtos.LJDiagnosticDTO;
import dtos.LJErrorDTO;
import dtos.LJWarningDTO;
import dtos.NotFoundErrorDTO;
import dtos.RefinementErrorDTO;
import dtos.StateConflictErrorDTO;
import dtos.StateRefinementErrorDTO;
import dtos.SyntaxErrorDTO;
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
 * Custom serializers for diagnostic classes that convert them to DTOs before serialization. This avoids issues with
 * serializing RuntimeException parent class.
 */
public class DiagnosticSerializers {

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

    public static class LJDiagnosticSerializer implements JsonSerializer<LJDiagnostic> {
        @Override
        public JsonElement serialize(LJDiagnostic src, Type typeOfSrc, JsonSerializationContext context) {
            LJDiagnosticDTO dto = LJDiagnosticDTO.from(src);
            return context.serialize(dto);
        }
    }

    public static class LJErrorSerializer implements JsonSerializer<LJError> {
        @Override
        public JsonElement serialize(LJError src, Type typeOfSrc, JsonSerializationContext context) {
            // Handle specific error types
            if (src instanceof RefinementError) {
                RefinementErrorDTO dto = RefinementErrorDTO.from((RefinementError) src);
                return context.serialize(dto);
            } else if (src instanceof StateRefinementError) {
                StateRefinementErrorDTO dto = StateRefinementErrorDTO.from((StateRefinementError) src);
                return context.serialize(dto);
            } else if (src instanceof SyntaxError) {
                SyntaxErrorDTO dto = SyntaxErrorDTO.from((SyntaxError) src);
                return context.serialize(dto);
            } else if (src instanceof CustomError) {
                CustomErrorDTO dto = CustomErrorDTO.from((CustomError) src);
                return context.serialize(dto);
            } else if (src instanceof GhostInvocationError) {
                GhostInvocationErrorDTO dto = GhostInvocationErrorDTO.from((GhostInvocationError) src);
                return context.serialize(dto);
            } else if (src instanceof InvalidRefinementError) {
                InvalidRefinementErrorDTO dto = InvalidRefinementErrorDTO.from((InvalidRefinementError) src);
                return context.serialize(dto);
            } else if (src instanceof StateConflictError) {
                StateConflictErrorDTO dto = StateConflictErrorDTO.from((StateConflictError) src);
                return context.serialize(dto);
            } else if (src instanceof NotFoundError) {
                NotFoundErrorDTO dto = NotFoundErrorDTO.from((NotFoundError) src);
                return context.serialize(dto);
            } else if (src instanceof IllegalConstructorTransitionError) {
                IllegalConstructorTransitionErrorDTO dto = IllegalConstructorTransitionErrorDTO
                        .from((IllegalConstructorTransitionError) src);
                return context.serialize(dto);
            } else {
                // Generic error fallback
                LJErrorDTO dto = LJErrorDTO.from(src);
                return context.serialize(dto);
            }
        }
    }

    public static class LJWarningSerializer implements JsonSerializer<LJWarning> {
        @Override
        public JsonElement serialize(LJWarning src, Type typeOfSrc, JsonSerializationContext context) {
            // Handle specific warning types
            if (src instanceof ExternalClassNotFoundWarning) {
                ExternalClassNotFoundWarningDTO dto = ExternalClassNotFoundWarningDTO
                        .from((ExternalClassNotFoundWarning) src);
                return context.serialize(dto);
            } else if (src instanceof ExternalMethodNotFoundWarning) {
                ExternalMethodNotFoundWarningDTO dto = ExternalMethodNotFoundWarningDTO
                        .from((ExternalMethodNotFoundWarning) src);
                return context.serialize(dto);
            } else {
                // Generic warning fallback
                LJWarningDTO dto = LJWarningDTO.from(src);
                return context.serialize(dto);
            }
        }
    }
}
