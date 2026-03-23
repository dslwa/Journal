package com.journal.backend.service;

import com.journal.backend.dto.JournalEntryDto;
import com.journal.backend.model.JournalEntry;
import com.journal.backend.model.User;
import com.journal.backend.repository.JournalEntryRepository;
import com.journal.backend.repository.UserRepository;
import com.journal.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JournalEntryService {

    private final JournalEntryRepository journalEntryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<JournalEntryDto> listForUser(String email) {
        User user = getUser(email);
        return journalEntryRepository.findByUserIdOrderByEntryDateDesc(user.getId())
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<JournalEntryDto> listForUserBetween(String email, LocalDate from, LocalDate to) {
        User user = getUser(email);
        return journalEntryRepository.findByUserIdAndEntryDateBetween(user.getId(), from, to)
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public JournalEntryDto getByDate(String email, LocalDate date) {
        User user = getUser(email);
        JournalEntry entry = journalEntryRepository.findByUserIdAndEntryDate(user.getId(), date)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No journal entry for " + date));
        return toDto(entry);
    }

    @Transactional
    public JournalEntryDto createOrUpdate(String email, JournalEntryDto dto) {
        User user = getUser(email);

        JournalEntry entry = journalEntryRepository.findByUserIdAndEntryDate(user.getId(), dto.entryDate())
                .orElseGet(() -> JournalEntry.builder()
                        .user(user)
                        .entryDate(dto.entryDate())
                        .build());

        entry.setMood(dto.mood());
        entry.setEnergy(dto.energy());
        entry.setNotes(dto.notes());
        entry.setLessonsLearned(dto.lessonsLearned());
        entry.setMistakes(dto.mistakes());

        journalEntryRepository.save(entry);
        return toDto(entry);
    }

    @Transactional
    public void delete(String email, LocalDate date) {
        User user = getUser(email);
        JournalEntry entry = journalEntryRepository.findByUserIdAndEntryDate(user.getId(), date)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No journal entry for " + date));
        journalEntryRepository.delete(entry);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    private JournalEntryDto toDto(JournalEntry e) {
        return new JournalEntryDto(
                e.getId(),
                e.getEntryDate(),
                e.getMood(),
                e.getEnergy(),
                e.getNotes(),
                e.getLessonsLearned(),
                e.getMistakes(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
