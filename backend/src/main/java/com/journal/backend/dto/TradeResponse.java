package com.journal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class TradeResponse {

    private UUID id;
    private String ticker;
    private String direction;
    private Double entryPrice;
    private Double exitPrice;
    private Double positionSize;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private Double stopLoss;
    private UUID playbookId;
    private String playbookTitle;
    private String notes;
    private String tags;
    private Integer rating;
    private Double riskPercent;
    private String emotionBefore;
    private String emotionAfter;
    private String preTradeChecklist;
    private String postTradeReview;
    private Double pnl;
    private boolean open;
    private LocalDateTime createdAt;
}
