package dtos.errors;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.SyntaxError;

/**
 * DTO for serializing SyntaxError instances to JSON
 */
public record SyntaxErrorDTO(String category, String type, String title, String message, String file, ErrorPosition position,
        String refinement) {

    public static SyntaxErrorDTO from(SyntaxError error) {
        return new SyntaxErrorDTO("error", "syntax-error", error.getTitle(), error.getMessage(), error.getFile(),
                error.getPosition(), error.getRefinement());
    }
}
