package com.ayches.hotelerp.booking.dto;

import com.ayches.hotelerp.booking.domain.BoardType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Staff booking creation: the client is chosen explicitly. */
public record BookingCreateRequest(
        @NotNull Long roomId,
        @NotNull Long clientId,
        @NotNull @FutureOrPresent LocalDate checkInDate,
        @NotNull @Future LocalDate checkOutDate,
        @Min(1) @Max(10) short guests,
        @NotNull BoardType boardType,
        @Size(max = 1000) String notes) {
}
