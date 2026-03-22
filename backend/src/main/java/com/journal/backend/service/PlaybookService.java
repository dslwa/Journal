package com.journal.backend.service;

import com.journal.backend.dto.PlaybookRequest;
import com.journal.backend.dto.PlaybookResponse;
import com.journal.backend.exception.ResourceNotFoundException;
import com.journal.backend.mapper.PlaybookMapper;
import com.journal.backend.model.Playbook;
import com.journal.backend.model.User;
import com.journal.backend.repository.PlaybookRepository;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlaybookService {

    private final PlaybookRepository playbookRepository;
    private final UserRepository userRepository;
    private final PlaybookMapper playbookMapper;

    @Transactional(readOnly = true)
    public List<PlaybookResponse> list(String email) {
        User user = getUser(email);
        return playbookRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(playbookMapper::toResponse)
                .toList();
    }

    @Transactional
    public PlaybookResponse create(String email, PlaybookRequest request) {
        User user = getUser(email);
        Playbook playbook = playbookMapper.toEntity(user, request);
        return playbookMapper.toResponse(playbookRepository.save(playbook));
    }

    @Transactional
    public PlaybookResponse update(String email, UUID id, PlaybookRequest request) {
        Playbook playbook = getUserPlaybook(email, id);
        playbookMapper.updateEntity(playbook, request);
        return playbookMapper.toResponse(playbookRepository.save(playbook));
    }

    @Transactional
    public void delete(String email, UUID id) {
        Playbook playbook = getUserPlaybook(email, id);
        playbookRepository.delete(playbook);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    private Playbook getUserPlaybook(String email, UUID playbookId) {
        User user = getUser(email);
        return playbookRepository.findByIdAndUserId(playbookId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playbook", playbookId));
    }
}
