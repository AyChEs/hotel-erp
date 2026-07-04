package com.ayches.hotelerp.auth;

import com.ayches.hotelerp.auth.dto.LoginRequest;
import com.ayches.hotelerp.auth.dto.RegisterRequest;
import com.ayches.hotelerp.auth.dto.TokenResponse;
import com.ayches.hotelerp.common.exception.ConflictException;
import com.ayches.hotelerp.common.exception.InvalidCredentialsException;
import com.ayches.hotelerp.person.domain.Client;
import com.ayches.hotelerp.person.repository.ClientRepository;
import com.ayches.hotelerp.security.JwtProperties;
import com.ayches.hotelerp.security.JwtService;
import com.ayches.hotelerp.user.domain.RefreshToken;
import com.ayches.hotelerp.user.domain.Role;
import com.ayches.hotelerp.user.domain.User;
import com.ayches.hotelerp.user.repository.RefreshTokenRepository;
import com.ayches.hotelerp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final ClientRepository clients;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (users.existsByEmail(request.email())) {
            throw new ConflictException("Email is already registered");
        }
        if (clients.existsByDocumentId(request.documentId())) {
            throw new ConflictException("Document ID is already registered");
        }

        User user = users.save(new User(
                request.email(), passwordEncoder.encode(request.password()), Role.CLIENT));

        Client client = new Client();
        client.setFirstName(request.firstName());
        client.setLastName(request.lastName());
        client.setDocumentId(request.documentId());
        client.setPhone(request.phone());
        client.setUser(user);
        clients.save(client);

        return issueTokens(user);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = users.findByEmail(request.email())
                .filter(User::isEnabled)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
        return issueTokens(user);
    }

    /**
     * Rotation with reuse detection: a valid token is revoked and replaced on every
     * refresh. If a revoked/expired token is presented again (possible theft), every
     * active token of that user is revoked and re-authentication is required.
     * noRollbackFor: the family revocation must survive the 401 we throw after it.
     */
    @Transactional(noRollbackFor = InvalidCredentialsException.class)
    public TokenResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokens.findByTokenHash(sha256(rawRefreshToken))
                .orElseThrow(() -> new InvalidCredentialsException("Unknown refresh token"));

        if (!stored.isActive()) {
            log.warn("Refresh token reuse detected for user {} — revoking all sessions",
                    stored.getUser().getEmail());
            refreshTokens.revokeAllForUser(stored.getUser());
            throw new InvalidCredentialsException("Refresh token is no longer valid");
        }

        stored.setRevoked(true);
        refreshTokens.save(stored);
        return issueTokens(stored.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokens.findByTokenHash(sha256(rawRefreshToken))
                .ifPresent(token -> token.setRevoked(true));
    }

    private TokenResponse issueTokens(User user) {
        String rawRefresh = generateOpaqueToken();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(sha256(rawRefresh));
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plus(jwtProperties.refreshTokenTtl()));
        refreshTokens.save(refreshToken);

        return new TokenResponse(
                jwtService.issueAccessToken(user),
                rawRefresh,
                "Bearer",
                jwtProperties.accessTokenTtl().toSeconds(),
                new TokenResponse.UserSummary(user.getId(), user.getEmail(), user.getRole().name()));
    }

    private static String generateOpaqueToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
