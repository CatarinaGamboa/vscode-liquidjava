package dtos.diagnostics;

import liquidjava.diagnostics.LJDiagnostic;
import liquidjava.diagnostics.ErrorPosition;

/**
 * DTO for serializing LJDiagnostic instances to JSON
 */
public record LJDiagnosticDTO(String title, String message, String details, String file, ErrorPosition position) {

    public static LJDiagnosticDTO from(LJDiagnostic diagnostic) {
        return new LJDiagnosticDTO(diagnostic.getTitle(), diagnostic.getMessage(), diagnostic.getDetails(),
                diagnostic.getFile(), diagnostic.getPosition());
    }
}
