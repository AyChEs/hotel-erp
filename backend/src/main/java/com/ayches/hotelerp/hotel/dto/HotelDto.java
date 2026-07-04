package com.ayches.hotelerp.hotel.dto;

public record HotelDto(
        Long id, String name, String address, String city, String country,
        String phone, String email, String description, String imageUrl,
        boolean active, CategoryDto category) {
}
