package com.ayches.hotelerp.booking.dto;

import com.ayches.hotelerp.booking.domain.BoardType;
import com.ayches.hotelerp.booking.domain.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record BookingDto(
        Long id, String code, LocalDate checkInDate, LocalDate checkOutDate,
        short guests, BoardType boardType, BookingStatus status,
        BigDecimal totalPrice, String notes, Instant createdAt,
        Long roomId, String roomNumber, Long hotelId, String hotelName,
        Long clientId, String clientFullName, Long invoiceId) {
}
