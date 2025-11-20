package dtos.warnings;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.warnings.ExternalMethodNotFoundWarning;

/**
 * Record DTO for serializing ExternalMethodNotFoundWarning instances to JSON
 */
public record ExternalMethodNotFoundWarningDTO(String category, String type, String title, String message, String details, String file,
        ErrorPosition position, String methodName, String className, String[] overloads) {

    public static ExternalMethodNotFoundWarningDTO from(ExternalMethodNotFoundWarning warning) {
        return new ExternalMethodNotFoundWarningDTO("warning", "external-method-not-found-warning", warning.getTitle(), warning.getMessage(), warning.getDetails(),
                warning.getFile(), warning.getPosition(), warning.getMethodName(), warning.getClassName(), warning.getOverloads());
    }
}
