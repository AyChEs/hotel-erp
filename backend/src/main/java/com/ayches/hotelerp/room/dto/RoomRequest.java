package com.ayches.hotelerp.room.dto;

import com.ayches.hotelerp.room.domain.RoomStatus;
import com.ayches.hotelerp.room.domain.RoomType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record RoomRequest(
        @NotBlank @Size(max = 20) String number,
        Short floor,
        @NotNull RoomType type,
        @NotNull RoomStatus status,
        @Min(1) @Max(10) short capacity,
        @Size(max = 500) String description,
        @Size(max = 500) String imageUrl,
        @NotNull @DecimalMin("0.00") BigDecimal pricePerNight,
        @NotNull @DecimalMin("0.00") BigDecimal halfBoardSupplement,
        @NotNull @DecimalMin("0.00") BigDecimal fullBoardSupplement,
        @NotNull Long hotelId) {
}
