package com.ayches.hotelerp.invoice.web;

import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.invoice.domain.InvoiceStatus;
import com.ayches.hotelerp.invoice.dto.GenerateInvoiceRequest;
import com.ayches.hotelerp.invoice.dto.InvoiceDto;
import com.ayches.hotelerp.invoice.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Invoices (staff)")
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
public class InvoiceController {

    private final InvoiceService service;

    @GetMapping
    public PageResponse<InvoiceDto> search(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) Long clientId,
            @ParameterObject @PageableDefault(size = 20, sort = "issuedAt",
                    direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(status, clientId, pageable);
    }

    @GetMapping("/{id}")
    public InvoiceDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @Operation(summary = "Generate the invoice for a booking (VAT breakdown, sequential number)")
    @PostMapping
    public ResponseEntity<InvoiceDto> generate(@Valid @RequestBody GenerateInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generate(request));
    }

    @PostMapping("/{id}/pay")
    public InvoiceDto markPaid(@PathVariable Long id) {
        return service.markPaid(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public InvoiceDto cancel(@PathVariable Long id) {
        return service.cancel(id);
    }
}
