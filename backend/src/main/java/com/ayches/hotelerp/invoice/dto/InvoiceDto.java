package com.ayches.hotelerp.invoice.dto;

import com.ayches.hotelerp.invoice.domain.InvoiceStatus;
import com.ayches.hotelerp.invoice.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;

public record InvoiceDto(
        Long id, String invoiceNumber, Instant issuedAt,
        BigDecimal subtotal, BigDecimal vatRate, BigDecimal vatAmount, BigDecimal total,
        PaymentMethod paymentMethod, InvoiceStatus status,
        Long bookingId, String bookingCode, Long clientId, String clientFullName,
        String hotelName) {
}
