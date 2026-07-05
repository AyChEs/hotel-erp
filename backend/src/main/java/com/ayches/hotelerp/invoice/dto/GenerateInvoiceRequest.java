package com.ayches.hotelerp.invoice.dto;

import com.ayches.hotelerp.invoice.domain.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record GenerateInvoiceRequest(
        @NotNull Long bookingId,
        @NotNull PaymentMethod paymentMethod) {
}
