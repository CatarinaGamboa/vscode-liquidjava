package dtos;

import liquidjava.processor.context.PlacementInCode;

/**
 * Record DTO for serializing PlacementInCode instances to JSON
 */
public record PlacementInCodeDTO(String text, PositionDTO position) {

    public static PlacementInCodeDTO from(PlacementInCode placement) {
        return new PlacementInCodeDTO(
            placement.getText(),
            PositionDTO.from(placement.getPosition())
        );
    }
}
