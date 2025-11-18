package dtos.errors;

import dtos.diagnostics.TranslationTableDTO;
import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.NotFoundError;

/**
 * Record DTO for serializing NotFoundError instances to JSON
 */
public record NotFoundErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        TranslationTableDTO translationTable) {

    public static NotFoundErrorDTO from(NotFoundError error) {
        return new NotFoundErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), TranslationTableDTO.from(error.getTranslationTable()));
    }
}
