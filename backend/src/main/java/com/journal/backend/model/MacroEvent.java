package com.journal.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "macro_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MacroEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "event_name", nullable = false, length = 500)
    private String eventName;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "event_time")
    private LocalTime eventTime;

    @Column(length = 10)
    private String country;

    @Column(length = 10)
    private String impact;

    @Column(length = 50)
    private String actual;

    @Column(length = 50)
    private String forecast;

    @Column(length = 50)
    private String previous;

    @Column(length = 10)
    private String currency;

    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt;

    @PrePersist
    protected void onCreate() {
        fetchedAt = LocalDateTime.now();
    }
}
