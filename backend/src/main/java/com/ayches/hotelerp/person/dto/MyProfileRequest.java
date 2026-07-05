package com.ayches.hotelerp.person.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Self-service profile update: documentId and clientType stay staff-managed. */
public record MyProfileRequest(
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @Past LocalDate birthDate,
        @Size(max = 40) String phone,
        @Size(max = 200) String address) {
}
