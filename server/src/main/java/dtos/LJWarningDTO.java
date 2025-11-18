package dtos;

import liquidjava.diagnostics.ErrorPosition;
import liquidjava.diagnostics.warnings.LJWarning;

/**
 * Record DTO for serializing LJWarning instances to JSON
 */
public record LJWarningDTO(String title, String message, String details, String file, ErrorPosition position) {

    public static LJWarningDTO from(LJWarning warning) {
        return new LJWarningDTO(warning.getTitle(), warning.getMessage(), warning.getDetails(), warning.getFile(),
                warning.getPosition());
    }
}
