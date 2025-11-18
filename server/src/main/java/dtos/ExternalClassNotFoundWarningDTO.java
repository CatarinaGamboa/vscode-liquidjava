package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.warnings.ExternalClassNotFoundWarning;

/**
 * Record DTO for serializing ExternalClassNotFoundWarning instances to JSON
 */
public record ExternalClassNotFoundWarningDTO(String title, String message, String details, String file,
        ErrorPosition position, String className) {

    public static ExternalClassNotFoundWarningDTO from(ExternalClassNotFoundWarning warning) {
        return new ExternalClassNotFoundWarningDTO(warning.getTitle(), warning.getMessage(), warning.getDetails(),
                warning.getFile(), warning.getPosition(), warning.getClassName());
    }
}
