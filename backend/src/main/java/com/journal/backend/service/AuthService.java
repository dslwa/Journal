package com.journal.backend.service;

import com.journal.backend.dto.*;
import com.journal.backend.enums.Role;
import com.journal.backend.exception.EmailAlreadyExistsException;
import com.journal.backend.exception.InvalidCredentialsException;
import com.journal.backend.model.PasswordResetToken;
import com.journal.backend.model.User;
import com.journal.backend.repository.PasswordResetTokenRepository;
import com.journal.backend.repository.UserRepository;
import com.journal.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${admin.username:}")
    private String adminUsername;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException();
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setUsername(request.getUsername());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        if (Boolean.TRUE.equals(user.getDisabled())) {
            throw new IllegalArgumentException("Account is disabled");
        }

        if (adminUsername != null && !adminUsername.isBlank()
                && adminUsername.equals(user.getUsername())
                && user.getRole() != Role.ADMIN) {
            user.setRole(Role.ADMIN);
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getRole().name());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        var userOpt = userRepository.findByEmail(request.email());

        // Always return success to prevent email enumeration
        if (userOpt.isEmpty()) {
            return;
        }

        var user = userOpt.get();

        passwordResetTokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        resetToken.setUsed(false);

        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        var resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (!resetToken.isValid()) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        var user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
}
