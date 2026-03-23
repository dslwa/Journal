package com.journal.backend.model;

import com.journal.backend.enums.TradeDirection;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "trades")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String ticker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TradeDirection direction;

    @Column(name = "entry_price", nullable = false)
    private Double entryPrice;

    @Column(name = "exit_price")
    private Double exitPrice;

    @Column(name = "position_size", nullable = false)
    private Double positionSize;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "stop_loss")
    private Double stopLoss;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playbook_id")
    private Playbook playbook;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 500)
    private String tags;

    private Integer rating;

    @Column(name = "risk_percent")
    private Double riskPercent;

    @Column(name = "emotion_before", length = 50)
    private String emotionBefore;

    @Column(name = "emotion_after", length = 50)
    private String emotionAfter;

    @Column(name = "pre_trade_checklist", columnDefinition = "TEXT")
    private String preTradeChecklist;

    @Column(name = "post_trade_review", columnDefinition = "TEXT")
    private String postTradeReview;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
