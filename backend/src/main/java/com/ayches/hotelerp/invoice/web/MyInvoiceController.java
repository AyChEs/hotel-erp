package com.ayches.hotelerp.invoice.web;

import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.invoice.dto.InvoiceDto;
import com.ayches.hotelerp.invoice.service.InvoiceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "My invoices (client)")
@RestController
@RequestMapping("/api/me/invoices")
@RequiredArgsConstructor
public class MyInvoiceController {

    private final InvoiceService service;

    @GetMapping
    public PageResponse<InvoiceDto> mine(Authentication auth,
            @ParameterObject @PageableDefault(size = 10, sort = "issuedAt",
                    direction = Sort.Direction.DESC) Pageable pageable) {
        return service.findMine(auth.getName(), pageable);
    }

    @GetMapping("/{id}")
    public InvoiceDto get(Authentication auth, @PathVariable Long id) {
        return service.findOwn(auth.getName(), id);
    }
}
