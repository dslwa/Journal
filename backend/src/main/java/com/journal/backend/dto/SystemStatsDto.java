package com.journal.backend.dto;

public record SystemStatsDto(
        long totalUsers,
        long activeUsers,
        long totalTrades,
        long totalJournalEntries,
        double avgTradesPerUser
) {}
