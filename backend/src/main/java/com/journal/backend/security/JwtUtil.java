package com.journal.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    // Konstruktor — inicjalizuje klucz szyfrowania HMAC na podstawie sekretu z konfiguracji
    // oraz ustawia czas wygaśnięcia tokena (w milisekundach)
    public JwtUtil(@Value("${jwt.secret}") String secret,
                   @Value("${jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMs = expirationMs;
    }

    // Generuje token JWT zawierający email użytkownika (jako subject), jego rolę,
    // datę wydania oraz datę wygaśnięcia, podpisany kluczem HMAC
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    // Wyciąga adres email (subject) z tokena JWT
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    // Sprawdza czy token JWT jest poprawny (prawidłowy podpis i nie wygasł).
    // Zwraca true jeśli token jest ważny, false w przeciwnym razie
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Parsuje i weryfikuje token JWT, zwracając obiekt Claims zawierający
    // wszystkie dane zapisane w tokenie (email, rola, daty itp.)
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
