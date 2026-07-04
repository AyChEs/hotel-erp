package com.ayches.hotelerp.invoice.repository;

import com.ayches.hotelerp.invoice.domain.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {
    Page<Invoice> findByClientUserEmail(String email, Pageable pageable);
    Optional<Invoice> findByBookingId(Long bookingId);
    long countByInvoiceNumberStartingWith(String prefix);
}
