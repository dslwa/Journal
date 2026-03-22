package com.journal.backend.security;

import com.journal.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        System.out.println("JwtAuthFilter - Auth Header: " + authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("JwtAuthFilter - No Bearer token found. Skipping filter.");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        System.out.println("JwtAuthFilter - Extracted token: " + token);

        if (jwtUtil.isTokenValid(token)) {
            System.out.println("JwtAuthFilter - Token is valid.");
            String email = jwtUtil.extractEmail(token);
            System.out.println("JwtAuthFilter - Email from token: " + email);

            userRepository.findByEmail(email).ifPresentOrElse(user -> {
                System.out.println("JwtAuthFilter - User found: " + user.getEmail());
                var auth = new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }, () -> {
                System.out.println("JwtAuthFilter - User not found for email: " + email);
            });
        } else {
            System.out.println("JwtAuthFilter - Token is INVALID.");
        }
        filterChain.doFilter(request, response);
    }
}
