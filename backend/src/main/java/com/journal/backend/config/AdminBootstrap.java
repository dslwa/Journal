package com.journal.backend.config;

import com.journal.backend.enums.Role;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;

    @Value("${admin.username:}")
    private String adminUsername;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminUsername == null || adminUsername.isBlank()) {
            return;
        }

        userRepository.findByUsername(adminUsername).ifPresentOrElse(
                user -> {
                    if (user.getRole() != Role.ADMIN) {
                        user.setRole(Role.ADMIN);
                        userRepository.save(user);
                        log.info("Promoted user '{}' to ADMIN role", adminUsername);
                    }
                },
                () -> log.warn("ADMIN_USERNAME='{}' not found. Register this user first, then restart.", adminUsername)
        );
    }
}
