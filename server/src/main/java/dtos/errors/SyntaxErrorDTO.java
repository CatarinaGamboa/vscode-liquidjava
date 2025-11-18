package dtos.errors;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.SyntaxError;

/**
 * Record DTO for serializing SyntaxError instances to JSON
 */
public record SyntaxErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        String refinement) {

    public static SyntaxErrorDTO from(SyntaxError error) {
        return new SyntaxErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), error.getRefinement());
    }
}
