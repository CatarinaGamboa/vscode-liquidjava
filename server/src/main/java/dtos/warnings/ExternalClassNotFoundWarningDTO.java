package dtos.warnings;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.warnings.ExternalClassNotFoundWarning;

/**
 * Record DTO for serializing ExternalClassNotFoundWarning instances to JSON
 */
public record ExternalClassNotFoundWarningDTO(String category, String type, String title, String message, String file,
        ErrorPosition position, String className) {

    public static ExternalClassNotFoundWarningDTO from(ExternalClassNotFoundWarning warning) {
        return new ExternalClassNotFoundWarningDTO("warning", "external-class-not-found-warning", warning.getTitle(), warning.getMessage(), warning.getFile(),
                warning.getPosition(), warning.getClassName());
    }
}
