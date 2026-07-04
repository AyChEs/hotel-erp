package com.ayches.hotelerp.hotel.domain;

import com.ayches.hotelerp.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "category")
public class Category extends BaseEntity {

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(name = "star_rating", nullable = false)
    private short starRating;

    @Column(length = 500)
    private String description;
}
