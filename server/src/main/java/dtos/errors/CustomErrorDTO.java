package dtos.errors;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.CustomError;

/**
 * DTO for serializing CustomError instances to JSON
 */
public record CustomErrorDTO(String category, String type, String title, String message, String file, ErrorPosition position) {

    public static CustomErrorDTO from(CustomError error) {
        return new CustomErrorDTO("error", "custom-error", error.getTitle(), error.getMessage(), error.getFile(),
                error.getPosition());
    }
}
