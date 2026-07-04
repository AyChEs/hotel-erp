package com.ayches.hotelerp.room.domain;

import com.ayches.hotelerp.common.domain.BaseEntity;
import com.ayches.hotelerp.hotel.domain.Hotel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "room", uniqueConstraints = @UniqueConstraint(
        name = "uq_room_number_per_hotel", columnNames = {"hotel_id", "number"}))
public class Room extends BaseEntity {

    @Column(nullable = false, length = 20)
    private String number;

    private Short floor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoomType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoomStatus status = RoomStatus.AVAILABLE;

    @Column(nullable = false)
    private short capacity;

    @Column(length = 500)
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "price_per_night", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerNight;

    @Column(name = "half_board_supplement", nullable = false, precision = 10, scale = 2)
    private BigDecimal halfBoardSupplement = BigDecimal.ZERO;

    @Column(name = "full_board_supplement", nullable = false, precision = 10, scale = 2)
    private BigDecimal fullBoardSupplement = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;
}
