package com.journal.backend.repository;

import com.journal.backend.model.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    List<JournalEntry> findByUserIdOrderByEntryDateDesc(UUID userId);

    Optional<JournalEntry> findByUserIdAndEntryDate(UUID userId, LocalDate entryDate);

    List<JournalEntry> findByUserIdAndEntryDateBetween(UUID userId, LocalDate from, LocalDate to);

    long countByUserId(UUID userId);
}
