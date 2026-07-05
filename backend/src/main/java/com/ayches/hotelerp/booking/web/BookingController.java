package com.ayches.hotelerp.booking.web;

import com.ayches.hotelerp.booking.domain.BookingStatus;
import com.ayches.hotelerp.booking.dto.BookingCreateRequest;
import com.ayches.hotelerp.booking.dto.BookingDto;
import com.ayches.hotelerp.booking.service.BookingService;
import com.ayches.hotelerp.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "Bookings (staff)")
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
public class BookingController {

    private final BookingService service;

    @GetMapping
    public PageResponse<BookingDto> search(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @ParameterObject @PageableDefault(size = 20, sort = "checkInDate",
                    direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(status, hotelId, clientId, from, to, pageable);
    }

    @GetMapping("/{id}")
    public BookingDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @Operation(summary = "Create a booking on behalf of a client (front desk)")
    @PostMapping
    public ResponseEntity<BookingDto> create(@Valid @RequestBody BookingCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PostMapping("/{id}/confirm")
    public BookingDto confirm(@PathVariable Long id) {
        return service.confirm(id);
    }

    @PostMapping("/{id}/check-in")
    public BookingDto checkIn(@PathVariable Long id) {
        return service.checkIn(id);
    }

    @PostMapping("/{id}/check-out")
    public BookingDto checkOut(@PathVariable Long id) {
        return service.checkOut(id);
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id) {
        return service.cancel(id);
    }
}
