package com.ayches.hotelerp.booking.repository;

import com.ayches.hotelerp.booking.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {
    Page<Booking> findByClientId(Long clientId, Pageable pageable);
    Page<Booking> findByClientUserEmail(String email, Pageable pageable);
    boolean existsByCode(String code);
    long countByStatus(com.ayches.hotelerp.booking.domain.BookingStatus status);
}
