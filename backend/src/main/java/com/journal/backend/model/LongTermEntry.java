package com.journal.backend.model;

import com.journal.backend.enums.LongTermCategory;
import com.journal.backend.enums.LongTermStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "long_term_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LongTermEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LongTermCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LongTermStatus status;

    @Column(length = 80)
    private String asset;

    @Column(length = 50)
    private String horizon;

    @Column(columnDefinition = "TEXT")
    private String thesis;

    @Column(name = "trigger_plan", columnDefinition = "TEXT")
    private String triggerPlan;

    @Column(columnDefinition = "TEXT")
    private String invalidation;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
