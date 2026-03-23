package com.journal.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "trade_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "trade_id", nullable = false)
    private UUID tradeId;

    @Column(nullable = false)
    private String filename;

    private String contentType;

    @Column(nullable = false)
    private long size;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;
}
