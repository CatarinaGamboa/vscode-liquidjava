package dtos.errors;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.IllegalConstructorTransitionError;

/**
 * Record DTO for serializing IllegalConstructorTransitionError instances to JSON
 */
public record IllegalConstructorTransitionErrorDTO(String category, String type, String title, String message, String details, String file,
        ErrorPosition position) {

    public static IllegalConstructorTransitionErrorDTO from(IllegalConstructorTransitionError error) {
        return new IllegalConstructorTransitionErrorDTO("error", "illegal-constructor-transition-error", error.getTitle(), error.getMessage(), error.getDetails(),
                error.getFile(), error.getPosition());
    }
}
