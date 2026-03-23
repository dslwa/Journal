package com.journal.backend.service;

import com.journal.backend.dto.AdminUserDto;
import com.journal.backend.dto.SystemConfigDto;
import com.journal.backend.dto.SystemStatsDto;
import com.journal.backend.model.SystemConfig;
import com.journal.backend.model.User;
import com.journal.backend.repository.JournalEntryRepository;
import com.journal.backend.repository.SystemConfigRepository;
import com.journal.backend.repository.TradeRepository;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TradeRepository tradeRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<AdminUserDto> listUsers() {
        return userRepository.findAll().stream().map(user -> {
            long tradeCount = tradeRepository.countByUserId(user.getId());
            long journalCount = journalEntryRepository.countByUserId(user.getId());
            LocalDateTime lastTrade = tradeRepository.findLastOpenedAtByUserId(user.getId());
            return new AdminUserDto(
                    user.getId(), user.getUsername(), user.getEmail(),
                    user.getRole().name(), user.getDisabled(),
                    tradeCount, journalCount, lastTrade
            );
        }).toList();
    }

    @Transactional
    public void disableUser(String adminEmail, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getEmail().equals(adminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot disable yourself");
        }
        user.setDisabled(!Boolean.TRUE.equals(user.getDisabled()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String adminEmail, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getEmail().equals(adminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete yourself");
        }
        userRepository.delete(user);
    }

    @Transactional
    public void resetUserPassword(UUID userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public SystemStatsDto getStats() {
        long totalUsers = userRepository.count();
        long totalTrades = tradeRepository.count();
        long totalJournalEntries = journalEntryRepository.count();
        long activeUsers = tradeRepository.countDistinctUsersWithTradesAfter(
                LocalDateTime.now().minusDays(30));
        double avgTradesPerUser = totalUsers > 0 ? (double) totalTrades / totalUsers : 0;
        return new SystemStatsDto(totalUsers, activeUsers, totalTrades, totalJournalEntries, avgTradesPerUser);
    }

    @Transactional(readOnly = true)
    public List<SystemConfigDto> getConfig() {
        return systemConfigRepository.findAll().stream()
                .map(c -> new SystemConfigDto(c.getConfigKey(), c.getConfigValue()))
                .toList();
    }

    @Transactional
    public void updateConfig(List<SystemConfigDto> entries) {
        for (SystemConfigDto dto : entries) {
            SystemConfig config = systemConfigRepository.findById(dto.key())
                    .orElse(SystemConfig.builder().configKey(dto.key()).build());
            config.setConfigValue(dto.value());
            systemConfigRepository.save(config);
        }
    }
}
