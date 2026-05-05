package com.journal.backend.security;

import com.journal.backend.enums.Role;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    // Konstruktor — przyjmuje narzędzie JwtUtil do weryfikacji tokenów
    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    // Filtr wykonywany przy każdym żądaniu HTTP. Wyciąga token JWT z nagłówka "Authorization",
    // weryfikuje go, odczytuje email i rolę użytkownika, a następnie ustawia kontekst
    // bezpieczeństwa Spring Security, aby dalsze przetwarzanie żądania znało tożsamość użytkownika
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtUtil.isTokenValid(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
                Claims claims = jwtUtil.parseClaims(token);
                String email = claims.getSubject();
                String roleStr = claims.get("role", String.class);
                Role role = roleStr != null ? Role.valueOf(roleStr) : Role.USER;

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(email, null,
                                List.of(new SimpleGrantedAuthority(role.authority())));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
