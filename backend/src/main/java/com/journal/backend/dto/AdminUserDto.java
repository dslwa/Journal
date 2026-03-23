package com.journal.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserDto(
        UUID id,
        String username,
        String email,
        String role,
        Boolean disabled,
        long tradeCount,
        long journalEntryCount,
        LocalDateTime lastTradeAt
) {}
