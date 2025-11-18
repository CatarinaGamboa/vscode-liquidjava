package dtos.errors;

import dtos.diagnostics.TranslationTableDTO;
import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.StateRefinementError;

/**
 * Record DTO for serializing StateRefinementError instances to JSON
 */
public record StateRefinementErrorDTO(String category, String type, String title, String message, String details, String file, ErrorPosition position,
        TranslationTableDTO translationTable, String method, String[] expected, String found) {

    public static StateRefinementErrorDTO from(StateRefinementError error) {
        return new StateRefinementErrorDTO("error", "state-refinement-error", error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), TranslationTableDTO.from(error.getTranslationTable()), error.getMethod(), error.getExpected(),
                error.getFound());
    }
}
