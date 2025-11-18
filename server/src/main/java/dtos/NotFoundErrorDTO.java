package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.TranslationTable;
import liquidjava.diagnostics.errors.NotFoundError;

/**
 * Record DTO for serializing NotFoundError instances to JSON
 */
public record NotFoundErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        TranslationTable translationTable) {

    public static NotFoundErrorDTO from(NotFoundError error) {
        return new NotFoundErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), error.getTranslationTable());
    }
}
