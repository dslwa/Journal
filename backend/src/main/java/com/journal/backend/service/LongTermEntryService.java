package com.journal.backend.service;

import com.journal.backend.dto.LongTermEntryRequest;
import com.journal.backend.dto.LongTermEntryResponse;
import com.journal.backend.exception.ResourceNotFoundException;
import com.journal.backend.model.LongTermEntry;
import com.journal.backend.model.User;
import com.journal.backend.repository.LongTermEntryRepository;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LongTermEntryService {

    private final LongTermEntryRepository longTermEntryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<LongTermEntryResponse> list(String email) {
        User user = getUser(email);
        return longTermEntryRepository.findAllByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LongTermEntryResponse create(String email, LongTermEntryRequest request) {
        User user = getUser(email);
        LongTermEntry entry = LongTermEntry.builder()
                .user(user)
                .title(request.getTitle())
                .category(request.getCategory())
                .status(request.getStatus())
                .asset(request.getAsset())
                .horizon(request.getHorizon())
                .thesis(request.getThesis())
                .triggerPlan(request.getTriggerPlan())
                .invalidation(request.getInvalidation())
                .notes(request.getNotes())
                .targetDate(request.getTargetDate())
                .build();
        return toResponse(longTermEntryRepository.save(entry));
    }

    @Transactional
    public LongTermEntryResponse update(String email, UUID id, LongTermEntryRequest request) {
        LongTermEntry entry = getUserEntry(email, id);
        entry.setTitle(request.getTitle());
        entry.setCategory(request.getCategory());
        entry.setStatus(request.getStatus());
        entry.setAsset(request.getAsset());
        entry.setHorizon(request.getHorizon());
        entry.setThesis(request.getThesis());
        entry.setTriggerPlan(request.getTriggerPlan());
        entry.setInvalidation(request.getInvalidation());
        entry.setNotes(request.getNotes());
        entry.setTargetDate(request.getTargetDate());
        return toResponse(longTermEntryRepository.save(entry));
    }

    @Transactional
    public void delete(String email, UUID id) {
        LongTermEntry entry = getUserEntry(email, id);
        longTermEntryRepository.delete(entry);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    private LongTermEntry getUserEntry(String email, UUID id) {
        User user = getUser(email);
        return longTermEntryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LongTermEntry", id));
    }

    private LongTermEntryResponse toResponse(LongTermEntry entry) {
        return LongTermEntryResponse.builder()
                .id(entry.getId())
                .title(entry.getTitle())
                .category(entry.getCategory())
                .status(entry.getStatus())
                .asset(entry.getAsset())
                .horizon(entry.getHorizon())
                .thesis(entry.getThesis())
                .triggerPlan(entry.getTriggerPlan())
                .invalidation(entry.getInvalidation())
                .notes(entry.getNotes())
                .targetDate(entry.getTargetDate())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
