package dtos.errors;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.InvalidRefinementError;

/**
 * Record DTO for serializing InvalidRefinementError instances to JSON
 */
public record InvalidRefinementErrorDTO(String category, String type, String title, String message, String details, String file,
        ErrorPosition position, String refinement) {

    public static InvalidRefinementErrorDTO from(InvalidRefinementError error) {
        return new InvalidRefinementErrorDTO("error", "invalid-refinement-error", error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), error.getRefinement());
    }
}
