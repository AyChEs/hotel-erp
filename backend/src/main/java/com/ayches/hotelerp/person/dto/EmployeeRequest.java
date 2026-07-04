package com.ayches.hotelerp.person.dto;

import com.ayches.hotelerp.person.domain.EmployeePosition;
import com.ayches.hotelerp.person.domain.EmployeeStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmployeeRequest(
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @NotBlank @Size(max = 40) String documentId,
        @Past LocalDate birthDate,
        @Size(max = 40) String phone,
        @Size(max = 200) String address,
        @NotNull EmployeePosition position,
        @NotNull EmployeeStatus status,
        @NotNull LocalDate hiredAt,
        @DecimalMin("0.00") BigDecimal grossSalary,
        Long hotelId) {
}
