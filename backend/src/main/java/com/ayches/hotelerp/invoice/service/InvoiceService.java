package com.ayches.hotelerp.invoice.service;

import com.ayches.hotelerp.booking.domain.Booking;
import com.ayches.hotelerp.booking.domain.BookingStatus;
import com.ayches.hotelerp.booking.repository.BookingRepository;
import com.ayches.hotelerp.common.exception.BusinessRuleException;
import com.ayches.hotelerp.common.exception.ConflictException;
import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.invoice.domain.Invoice;
import com.ayches.hotelerp.invoice.domain.InvoiceStatus;
import com.ayches.hotelerp.invoice.dto.GenerateInvoiceRequest;
import com.ayches.hotelerp.invoice.dto.InvoiceDto;
import com.ayches.hotelerp.invoice.mapper.InvoiceMapper;
import com.ayches.hotelerp.invoice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceService {

    /** Spanish standard VAT for accommodation is 10%. */
    private static final BigDecimal VAT_RATE = new BigDecimal("0.1000");

    private static final Set<BookingStatus> INVOICEABLE =
            Set.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT);

    private final InvoiceRepository invoices;
    private final BookingRepository bookings;
    private final InvoiceMapper mapper;

    public PageResponse<InvoiceDto> search(InvoiceStatus status, Long clientId, Pageable pageable) {
        Specification<Invoice> spec = Specification.where(null);
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (clientId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("client").get("id"), clientId));
        }
        return PageResponse.of(invoices.findAll(spec, pageable), mapper::toDto);
    }

    public InvoiceDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    public PageResponse<InvoiceDto> findMine(String email, Pageable pageable) {
        return PageResponse.of(invoices.findByClientUserEmail(email, pageable), mapper::toDto);
    }

    /** Clients can only fetch their own invoices; hide others behind 404. */
    public InvoiceDto findOwn(String email, Long id) {
        Invoice invoice = getOrThrow(id);
        boolean owned = invoice.getClient().getUser() != null
                && invoice.getClient().getUser().getEmail().equals(email);
        if (!owned) {
            throw new NotFoundException("Invoice", id);
        }
        return mapper.toDto(invoice);
    }

    @Transactional
    public InvoiceDto generate(GenerateInvoiceRequest request) {
        Booking booking = bookings.findById(request.bookingId())
                .orElseThrow(() -> new NotFoundException("Booking", request.bookingId()));
        if (!INVOICEABLE.contains(booking.getStatus())) {
            throw new BusinessRuleException(
                    "Only confirmed or checked-in/out bookings can be invoiced");
        }
        if (invoices.findByBookingId(booking.getId()).isPresent()) {
            throw new ConflictException("Booking already has an invoice");
        }

        // The booking total is VAT-inclusive; break it down for the invoice.
        BigDecimal total = booking.getTotalPrice();
        BigDecimal subtotal = total.divide(BigDecimal.ONE.add(VAT_RATE), 2, RoundingMode.HALF_UP);
        BigDecimal vatAmount = total.subtract(subtotal);

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(nextNumber());
        invoice.setBooking(booking);
        invoice.setClient(booking.getClient());
        invoice.setSubtotal(subtotal);
        invoice.setVatRate(VAT_RATE);
        invoice.setVatAmount(vatAmount);
        invoice.setTotal(total);
        invoice.setPaymentMethod(request.paymentMethod());
        return mapper.toDto(invoices.save(invoice));
    }

    @Transactional
    public InvoiceDto markPaid(Long id) {
        Invoice invoice = getOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.ISSUED) {
            throw new BusinessRuleException("Only issued invoices can be marked as paid");
        }
        invoice.setStatus(InvoiceStatus.PAID);
        return mapper.toDto(invoice);
    }

    @Transactional
    public InvoiceDto cancel(Long id) {
        Invoice invoice = getOrThrow(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessRuleException("Paid invoices cannot be cancelled");
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        return mapper.toDto(invoice);
    }

    private String nextNumber() {
        String prefix = "INV-" + Year.now().getValue() + "-";
        long seq = invoices.countByInvoiceNumberStartingWith(prefix) + 1;
        return prefix + "%04d".formatted(seq);
    }

    private Invoice getOrThrow(Long id) {
        return invoices.findById(id).orElseThrow(() -> new NotFoundException("Invoice", id));
    }
}
