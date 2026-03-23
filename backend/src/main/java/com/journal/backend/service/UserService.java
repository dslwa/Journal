package com.journal.backend.service;

import com.journal.backend.dto.MeResponse;
import com.journal.backend.exception.ResourceNotFoundException;
import com.journal.backend.model.User;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(String email) {
        User user = getByEmail(email);
        return toMeResponse(user);
    }

    @Transactional
    public MeResponse updateBalance(String email, Double initialBalance) {
        User user = getByEmail(email);
        user.setInitialBalance(initialBalance);
        userRepository.save(user);
        return toMeResponse(user);
    }

    private MeResponse toMeResponse(User user) {
        return new MeResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getInitialBalance(),
                user.getRole().name()
        );
    }
}
