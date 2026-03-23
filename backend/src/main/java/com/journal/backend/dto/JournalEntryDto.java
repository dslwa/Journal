package com.journal.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record JournalEntryDto(
        UUID id,
        LocalDate entryDate,
        Integer mood,
        Integer energy,
        String notes,
        String lessonsLearned,
        String mistakes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
