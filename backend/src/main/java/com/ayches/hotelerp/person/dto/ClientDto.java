package com.ayches.hotelerp.person.dto;

import com.ayches.hotelerp.person.domain.ClientType;

import java.time.Instant;
import java.time.LocalDate;

public record ClientDto(
        Long id, String firstName, String lastName, String documentId,
        LocalDate birthDate, String phone, String address,
        ClientType clientType, Instant registeredAt, String email) {
}
