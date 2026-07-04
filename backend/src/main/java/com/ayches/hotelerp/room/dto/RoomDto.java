package com.ayches.hotelerp.room.dto;

import com.ayches.hotelerp.room.domain.RoomStatus;
import com.ayches.hotelerp.room.domain.RoomType;

import java.math.BigDecimal;

public record RoomDto(
        Long id, String number, Short floor, RoomType type, RoomStatus status,
        short capacity, String description, String imageUrl,
        BigDecimal pricePerNight, BigDecimal halfBoardSupplement, BigDecimal fullBoardSupplement,
        Long hotelId, String hotelName) {
}
