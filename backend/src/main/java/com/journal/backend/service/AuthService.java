package com.journal.backend.service;

import com.journal.backend.dto.AuthResponse;
import com.journal.backend.dto.LoginRequest;
import com.journal.backend.dto.RegisterRequest;
import com.journal.backend.exception.EmailAlreadyExistsException;
import com.journal.backend.exception.InvalidCredentialsException;
import com.journal.backend.model.User;
import com.journal.backend.repository.UserRepository;
import com.journal.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest registerRequest) {

        if(userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new EmailAlreadyExistsException();
        }

        User user = createUser(registerRequest);
        String token = generateToken(user);

        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!isPasswordValid(loginRequest, user)) {
            throw new InvalidCredentialsException();
        }

        String token = generateToken(user);

        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getRole().name());
    }

    private User createUser(RegisterRequest registerRequest) {
        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setUsername(registerRequest.getUsername());
        return userRepository.save(user);
    }

    private boolean isPasswordValid(LoginRequest request,  User user) {
        return passwordEncoder.matches(request.getPassword(), user.getPassword());
    }

    private String generateToken(User user) {
        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }


}
