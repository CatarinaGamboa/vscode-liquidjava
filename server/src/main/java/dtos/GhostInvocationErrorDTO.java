package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.GhostInvocationError;

/**
 * Record DTO for serializing GhostInvocationError instances to JSON
 */
public record GhostInvocationErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        TranslationTableDTO translationTable, String expected) {

    public static GhostInvocationErrorDTO from(GhostInvocationError error) {
        return new GhostInvocationErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), TranslationTableDTO.from(error.getTranslationTable()), error.getExpected());
    }
}
