package dtos.errors;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.InvalidRefinementError;

/**
 * DTO for serializing InvalidRefinementError instances to JSON
 */
public record InvalidRefinementErrorDTO(String category, String type, String title, String message, String file,
        ErrorPosition position, String refinement) {

    public static InvalidRefinementErrorDTO from(InvalidRefinementError error) {
        return new InvalidRefinementErrorDTO("error", "invalid-refinement-error", error.getTitle(), error.getMessage(), error.getFile(),
                error.getPosition(), error.getRefinement());
    }
}
