package com.journal.backend.repository;

import com.journal.backend.model.TradeAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TradeAttachmentRepository extends JpaRepository<TradeAttachment, UUID> {

    List<TradeAttachment> findByTradeId(UUID tradeId);

    @Query("SELECT COUNT(a) > 0 FROM TradeAttachment a JOIN Trade t ON a.tradeId = t.id WHERE a.url = :url AND t.user.id = :userId")
    boolean existsByUrlAndTradeUserId(@Param("url") String url, @Param("userId") UUID userId);
}
