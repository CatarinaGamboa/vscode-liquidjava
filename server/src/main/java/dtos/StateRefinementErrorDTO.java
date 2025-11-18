package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.TranslationTable;
import liquidjava.diagnostics.errors.StateRefinementError;

/**
 * Record DTO for serializing StateRefinementError instances to JSON
 */
public record StateRefinementErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        TranslationTable translationTable, String method, String[] expected, String found) {

    public static StateRefinementErrorDTO from(StateRefinementError error) {
        return new StateRefinementErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), error.getTranslationTable(), error.getMethod(), error.getExpected(),
                error.getFound());
    }
}
