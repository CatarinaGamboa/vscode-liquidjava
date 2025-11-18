package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.warnings.ExternalMethodNotFoundWarning;

/**
 * Record DTO for serializing ExternalMethodNotFoundWarning instances to JSON
 */
public record ExternalMethodNotFoundWarningDTO(String title, String message, String details, String file,
        ErrorPosition position, String methodName, String className) {

    public static ExternalMethodNotFoundWarningDTO from(ExternalMethodNotFoundWarning warning) {
        return new ExternalMethodNotFoundWarningDTO(warning.getTitle(), warning.getMessage(), warning.getDetails(),
                warning.getFile(), warning.getPosition(), warning.getMethodName(), warning.getClassName());
    }
}
