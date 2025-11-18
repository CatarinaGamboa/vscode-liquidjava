package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.TranslationTable;
import liquidjava.diagnostics.errors.LJError;

/**
 * Record DTO for serializing LJError instances to JSON
 */
public record LJErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        TranslationTable translationTable) {

    public static LJErrorDTO from(LJError error) {
        return new LJErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), error.getTranslationTable());
    }
}
