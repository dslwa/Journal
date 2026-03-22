package com.journal.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaybookRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String rules;
    private String setup;
    private String timeframe;
    private String riskNote;
}
