package com.ayches.hotelerp.auth.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserSummary user) {

    public record UserSummary(Long id, String email, String role) {
    }
}
