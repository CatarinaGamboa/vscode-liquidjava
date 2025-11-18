package dtos.errors;

import dtos.diagnostics.TranslationTableDTO;
import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.StateConflictError;

/**
 * Record DTO for serializing StateConflictError instances to JSON
 */
public record StateConflictErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        TranslationTableDTO translationTable, String state, String className) {

    public static StateConflictErrorDTO from(StateConflictError error) {
        return new StateConflictErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), TranslationTableDTO.from(error.getTranslationTable()), error.getState(), error.getClassName());
    }
}
