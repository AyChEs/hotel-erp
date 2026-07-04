package com.ayches.hotelerp.person.domain;

import com.ayches.hotelerp.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Shared personal data for {@code Client} and {@code Employee}.
 * Deliberately a @MappedSuperclass (not entity inheritance): each subtype gets
 * its own table and its own id sequence — person ids are NOT globally unique.
 */
@Getter
@Setter
@MappedSuperclass
public abstract class Person extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(name = "document_id", nullable = false, length = 40, unique = true)
    private String documentId;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 40)
    private String phone;

    @Column(length = 200)
    private String address;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
