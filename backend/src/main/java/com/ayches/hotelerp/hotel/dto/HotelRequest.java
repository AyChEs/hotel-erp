package com.ayches.hotelerp.hotel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HotelRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 200) String address,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String country,
        @Size(max = 40) String phone,
        @Email @Size(max = 160) String email,
        @Size(max = 1000) String description,
        @Size(max = 500) String imageUrl,
        @NotNull Boolean active,
        @NotNull Long categoryId) {
}
