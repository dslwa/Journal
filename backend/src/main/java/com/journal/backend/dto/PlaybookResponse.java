package com.journal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class PlaybookResponse {

    private UUID id;
    private String title;
    private String description;
    private String content;
    private String rules;
    private String setup;
    private String timeframe;
    private String riskNote;
    private String tags;
    private String checklist;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
