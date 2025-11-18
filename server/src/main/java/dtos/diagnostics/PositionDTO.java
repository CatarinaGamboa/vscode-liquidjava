package dtos.diagnostics;

import spoon.reflect.cu.SourcePosition;

/**
 * Record DTO for serializing Spoon SourcePosition to JSON
 */
public record PositionDTO(String file, int line, int column) {

    public static PositionDTO from(SourcePosition position) {
        String file = position.getFile() != null ? position.getFile().getAbsolutePath() : "";
        return new PositionDTO(file, position.getLine(), position.getColumn());
    }
}
