package com.ayches.hotelerp.booking.web;

import com.ayches.hotelerp.booking.dto.BookingDto;
import com.ayches.hotelerp.booking.dto.MyBookingRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "My bookings (client)")
@RestController
@RequestMapping("/api/me/bookings")
@RequiredArgsConstructor
public class MyBookingController {

    private final BookingService service;

    @GetMapping
    public PageResponse<BookingDto> mine(Authentication auth,
            @ParameterObject @PageableDefault(size = 10, sort = "checkInDate",
                    direction = Sort.Direction.DESC) Pageable pageable) {
        return service.findMine(auth.getName(), pageable);
    }

    @Operation(summary = "Book a room for the authenticated client")
    @PostMapping
    public ResponseEntity<BookingDto> book(Authentication auth,
                                           @Valid @RequestBody MyBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createForUser(auth.getName(), request));
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(Authentication auth, @PathVariable Long id) {
        return service.cancelOwn(auth.getName(), id);
    }
}
