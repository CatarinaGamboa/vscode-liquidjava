package dtos.errors;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.CustomError;

/**
 * Record DTO for serializing CustomError instances to JSON
 */
public record CustomErrorDTO(String title, String message, String details, String file, ErrorPosition position) {

    public static CustomErrorDTO from(CustomError error) {
        return new CustomErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition());
    }
}
