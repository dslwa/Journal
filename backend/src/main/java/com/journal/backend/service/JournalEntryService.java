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

    // Pobiera wszystkie wpisy dziennika użytkownika posortowane od najnowszego
    @Transactional(readOnly = true)
    public List<JournalEntryDto> listForUser(String email) {
        User user = getUser(email);
        return journalEntryRepository.findByUserIdOrderByEntryDateDesc(user.getId())
                .stream().map(this::toDto).toList();
    }

    // Pobiera wpisy dziennika użytkownika z podanego zakresu dat (od–do)
    @Transactional(readOnly = true)
    public List<JournalEntryDto> listForUserBetween(String email, LocalDate from, LocalDate to) {
        User user = getUser(email);
        return journalEntryRepository.findByUserIdAndEntryDateBetween(user.getId(), from, to)
                .stream().map(this::toDto).toList();
    }

    // Pobiera pojedynczy wpis dziennika dla konkretnej daty, zwraca 404 jeśli nie istnieje
    @Transactional(readOnly = true)
    public JournalEntryDto getByDate(String email, LocalDate date) {
        User user = getUser(email);
        JournalEntry entry = journalEntryRepository.findByUserIdAndEntryDate(user.getId(), date)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No journal entry for " + date));
        return toDto(entry);
    }

    // Tworzy nowy wpis dziennika lub aktualizuje istniejący dla danej daty.
    // Ustawia nastrój, energię, notatki, wnioski i błędy
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

    // Usuwa wpis dziennika dla danej daty, zwraca 404 jeśli nie istnieje
    @Transactional
    public void delete(String email, LocalDate date) {
        User user = getUser(email);
        JournalEntry entry = journalEntryRepository.findByUserIdAndEntryDate(user.getId(), date)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No journal entry for " + date));
        journalEntryRepository.delete(entry);
    }

    // Pomocnicza — pobiera użytkownika po emailu, rzuca wyjątek jeśli nie znaleziono
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    // Pomocnicza — konwertuje encję JournalEntry na obiekt DTO do zwrócenia w odpowiedzi API
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
