package com.journal.backend.dto;

import com.journal.backend.enums.LongTermCategory;
import com.journal.backend.enums.LongTermStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class LongTermEntryResponse {

    private UUID id;
    private String title;
    private LongTermCategory category;
    private LongTermStatus status;
    private String asset;
    private String horizon;
    private String thesis;
    private String triggerPlan;
    private String invalidation;
    private String notes;
    private LocalDate targetDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
