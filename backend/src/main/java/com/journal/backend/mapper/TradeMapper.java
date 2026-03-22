package com.journal.backend.mapper;

import com.journal.backend.dto.TradeRequest;
import com.journal.backend.dto.TradeResponse;
import com.journal.backend.enums.TradeDirection;
import com.journal.backend.model.Playbook;
import com.journal.backend.model.Trade;
import com.journal.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class TradeMapper {

    public Trade toEntity(User user, TradeRequest request, Playbook playbook) {
        return Trade.builder()
                .user(user)
                .ticker(request.getTicker().toUpperCase())
                .direction(request.getDirection())
                .entryPrice(request.getEntryPrice())
                .exitPrice(request.getExitPrice())
                .positionSize(request.getPositionSize())
                .openedAt(request.getOpenedAt())
                .closedAt(request.getClosedAt())
                .stopLoss(request.getStopLoss())
                .playbook(playbook)
                .notes(request.getNotes())
                .build();
    }

    public void updateEntity(Trade trade, TradeRequest request, Playbook playbook) {
        trade.setTicker(request.getTicker().toUpperCase());
        trade.setDirection(request.getDirection());
        trade.setEntryPrice(request.getEntryPrice());
        trade.setExitPrice(request.getExitPrice());
        trade.setPositionSize(request.getPositionSize());
        trade.setOpenedAt(request.getOpenedAt());
        trade.setClosedAt(request.getClosedAt());
        trade.setStopLoss(request.getStopLoss());
        trade.setPlaybook(playbook);
        trade.setNotes(request.getNotes());
    }

    public TradeResponse toResponse(Trade trade) {
        return TradeResponse.builder()
                .id(trade.getId())
                .ticker(trade.getTicker())
                .direction(trade.getDirection().name())
                .entryPrice(trade.getEntryPrice())
                .exitPrice(trade.getExitPrice())
                .positionSize(trade.getPositionSize())
                .openedAt(trade.getOpenedAt())
                .closedAt(trade.getClosedAt())
                .stopLoss(trade.getStopLoss())
                .playbookId(getPlaybookId(trade))
                .playbookTitle(getPlaybookTitle(trade))
                .notes(trade.getNotes())
                .pnl(calculatePnl(trade))
                .open(trade.getClosedAt() == null)
                .createdAt(trade.getCreatedAt())
                .build();
    }

    private Double calculatePnl(Trade trade) {
        if (trade.getExitPrice() == null) {
            return null;
        }
        double multiplier = trade.getDirection() == TradeDirection.LONG ? 1 : -1;
        return (trade.getExitPrice() - trade.getEntryPrice()) * trade.getPositionSize() * multiplier;
    }

    private java.util.UUID getPlaybookId(Trade trade) {
        return trade.getPlaybook() != null ? trade.getPlaybook().getId() : null;
    }

    private String getPlaybookTitle(Trade trade) {
        return trade.getPlaybook() != null ? trade.getPlaybook().getTitle() : null;
    }
}
