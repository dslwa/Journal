package com.journal.backend.repository;

import com.journal.backend.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TradeRepository extends JpaRepository<Trade, UUID> {

    List<Trade> findAllByUserIdOrderByOpenedAtDesc(UUID userId);

    Optional<Trade> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);

    @Query("SELECT MAX(t.openedAt) FROM Trade t WHERE t.user.id = :userId")
    LocalDateTime findLastOpenedAtByUserId(UUID userId);

    @Query("SELECT COUNT(DISTINCT t.user.id) FROM Trade t WHERE t.openedAt > :since")
    long countDistinctUsersWithTradesAfter(LocalDateTime since);
}
