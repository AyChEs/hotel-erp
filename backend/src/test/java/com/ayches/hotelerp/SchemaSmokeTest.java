package com.ayches.hotelerp;

import com.ayches.hotelerp.booking.repository.BookingRepository;
import com.ayches.hotelerp.hotel.repository.HotelRepository;
import com.ayches.hotelerp.room.repository.RoomRepository;
import com.ayches.hotelerp.support.AbstractIntegrationTest;
import com.ayches.hotelerp.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the schema validates against the entities and the seed data loads,
 * exercising the availability query for good measure.
 */
class SchemaSmokeTest extends AbstractIntegrationTest {

    @Autowired HotelRepository hotels;
    @Autowired RoomRepository rooms;
    @Autowired UserRepository users;
    @Autowired BookingRepository bookings;

    @Test
    void seedDataIsLoaded() {
        // >= because the container is shared across test classes and others add rows
        assertThat(hotels.count()).isGreaterThanOrEqualTo(3);
        assertThat(rooms.count()).isGreaterThanOrEqualTo(10);
        assertThat(users.findByEmail("admin@hotel-erp.dev")).isPresent();
        assertThat(bookings.existsByCode("BK-2026-000001")).isTrue();
    }

    @Test
    void availabilityQueryExcludesBookedRooms() {
        // Riad suite (room id 7) is CONFIRMED for 2026-08-20..25 in demo data.
        var availableDuringBooking = rooms.findAvailable(
                2L, (short) 2, LocalDate.of(2026, 8, 21), LocalDate.of(2026, 8, 23));
        assertThat(availableDuringBooking).noneMatch(r -> r.getId().equals(7L));

        // Outside that window the suite is free again.
        var availableAfter = rooms.findAvailable(
                2L, (short) 2, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 3));
        assertThat(availableAfter).anyMatch(r -> r.getId().equals(7L));
    }
}
