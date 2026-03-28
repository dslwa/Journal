package com.journal.backend.dto;

import com.journal.backend.enums.LongTermCategory;
import com.journal.backend.enums.LongTermStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LongTermEntryRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Category is required")
    private LongTermCategory category;

    @NotNull(message = "Status is required")
    private LongTermStatus status;

    private String asset;
    private String horizon;
    private String thesis;
    private String triggerPlan;
    private String invalidation;
    private String notes;
    private LocalDate targetDate;
}
