package com.journal.backend.dto;

import com.journal.backend.enums.TradeDirection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TradeRequest {

    @NotBlank(message = "Ticker is required")
    private String ticker;

    @NotNull(message = "Direction is required")
    private TradeDirection direction;

    @NotNull(message = "Entry price is required")
    private Double entryPrice;

    private Double exitPrice;

    @NotNull(message = "Position size is required")
    private Double positionSize;

    @NotNull(message = "Opened at is required")
    private LocalDateTime openedAt;

    private LocalDateTime closedAt;
    private Double stopLoss;
    private String notes;
}
