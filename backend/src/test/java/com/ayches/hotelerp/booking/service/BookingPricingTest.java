package com.ayches.hotelerp.booking.service;

import com.ayches.hotelerp.booking.domain.BoardType;

import com.ayches.hotelerp.room.domain.Room;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class BookingPricingTest {

    private static final LocalDate IN = LocalDate.of(2026, 8, 10);

    private Room room(String base, String half, String full) {
        Room room = new Room();
        room.setPricePerNight(new BigDecimal(base));
        room.setHalfBoardSupplement(new BigDecimal(half));
        room.setFullBoardSupplement(new BigDecimal(full));
        return room;
    }

    @Test
    void roomOnlyAndBreakfastUseBasePriceTimesNights() {
        Room room = room("100.00", "15.00", "30.00");
        assertThat(BookingService.price(room, IN, IN.plusDays(3), (short) 2, BoardType.ROOM_ONLY))
                .isEqualByComparingTo("300.00");
        assertThat(BookingService.price(room, IN, IN.plusDays(3), (short) 2, BoardType.BED_AND_BREAKFAST))
                .isEqualByComparingTo("300.00");
    }

    @Test
    void halfBoardAddsPerGuestPerNightSupplement() {
        Room room = room("100.00", "15.00", "30.00");
        // (100 + 15*2) * 3 nights = 390
        assertThat(BookingService.price(room, IN, IN.plusDays(3), (short) 2, BoardType.HALF_BOARD))
                .isEqualByComparingTo("390.00");
    }

    @Test
    void fullBoardAddsLargerSupplement() {
        Room room = room("80.50", "12.25", "24.75");
        // (80.50 + 24.75*3) * 2 nights = (80.50 + 74.25) * 2 = 309.50
        assertThat(BookingService.price(room, IN, IN.plusDays(2), (short) 3, BoardType.FULL_BOARD))
                .isEqualByComparingTo("309.50");
    }

    @Test
    void singleNightSingleGuest() {
        Room room = room("59.90", "10.00", "20.00");
        assertThat(BookingService.price(room, IN, IN.plusDays(1), (short) 1, BoardType.HALF_BOARD))
                .isEqualByComparingTo("69.90");
    }
}
