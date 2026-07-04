package com.ayches.hotelerp.room.repository;

import com.ayches.hotelerp.room.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {

    boolean existsByHotelIdAndNumber(Long hotelId, String number);

    /**
     * Rooms in a hotel with the required capacity that have no active booking
     * overlapping [checkIn, checkOut). Half-open interval: same-day turnover is allowed.
     */
    @Query("""
            select r from Room r
            where r.hotel.id = :hotelId
              and r.capacity >= :guests
              and r.status <> com.ayches.hotelerp.room.domain.RoomStatus.OUT_OF_SERVICE
              and not exists (
                  select b from com.ayches.hotelerp.booking.domain.Booking b
                  where b.room = r
                    and b.status in (
                        com.ayches.hotelerp.booking.domain.BookingStatus.PENDING,
                        com.ayches.hotelerp.booking.domain.BookingStatus.CONFIRMED,
                        com.ayches.hotelerp.booking.domain.BookingStatus.CHECKED_IN)
                    and b.checkInDate < :checkOut
                    and b.checkOutDate > :checkIn)
            """)
    List<Room> findAvailable(@Param("hotelId") Long hotelId,
                             @Param("guests") short guests,
                             @Param("checkIn") LocalDate checkIn,
                             @Param("checkOut") LocalDate checkOut);
}
