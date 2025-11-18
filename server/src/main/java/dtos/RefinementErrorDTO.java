package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.errors.RefinementError;
import liquidjava.rj_language.opt.derivation_node.ValDerivationNode;

/**
 * Record DTO for serializing RefinementError instances to JSON
 */
public record RefinementErrorDTO(String title, String message, String details, String file, ErrorPosition position,
        TranslationTableDTO translationTable, String expected, ValDerivationNode found) {

    public static RefinementErrorDTO from(RefinementError error) {
        return new RefinementErrorDTO(error.getTitle(), error.getMessage(), error.getDetails(), error.getFile(),
                error.getPosition(), TranslationTableDTO.from(error.getTranslationTable()), error.getExpected(), error.getFound());
    }
}
