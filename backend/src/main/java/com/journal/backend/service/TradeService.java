package com.journal.backend.service;

import com.journal.backend.dto.TradeRequest;
import com.journal.backend.dto.TradeResponse;
import com.journal.backend.exception.ResourceNotFoundException;
import com.journal.backend.mapper.TradeMapper;
import com.journal.backend.model.Trade;
import com.journal.backend.model.User;
import com.journal.backend.repository.TradeRepository;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TradeService {

    private final TradeRepository tradeRepository;
    private final UserRepository userRepository;
    private final TradeMapper tradeMapper;

    @Transactional(readOnly = true)
    public List<TradeResponse> list(String email) {
        User user = getUser(email);
        return tradeRepository.findAllByUserIdOrderByOpenedAtDesc(user.getId())
                .stream()
                .map(tradeMapper::toResponse)
                .toList();
    }

    @Transactional
    public TradeResponse create(String email, TradeRequest request) {
        User user = getUser(email);
        Trade trade = tradeMapper.toEntity(user, request);
        return tradeMapper.toResponse(tradeRepository.save(trade));
    }

    @Transactional
    public TradeResponse update(String email, UUID id, TradeRequest request) {
        Trade trade = getUserTrade(email, id);
        tradeMapper.updateEntity(trade, request);
        return tradeMapper.toResponse(tradeRepository.save(trade));
    }

    @Transactional
    public void delete(String email, UUID id) {
        Trade trade = getUserTrade(email, id);
        tradeRepository.delete(trade);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    private Trade getUserTrade(String email, UUID tradeId) {
        User user = getUser(email);
        return tradeRepository.findByIdAndUserId(tradeId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trade", tradeId));
    }
}
