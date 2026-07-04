package com.ayches.hotelerp.person.dto;

import com.ayches.hotelerp.person.domain.EmployeePosition;
import com.ayches.hotelerp.person.domain.EmployeeStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmployeeDto(
        Long id, String firstName, String lastName, String documentId,
        LocalDate birthDate, String phone, String address,
        EmployeePosition position, EmployeeStatus status, LocalDate hiredAt,
        BigDecimal grossSalary, Long hotelId, String hotelName, String email) {
}
