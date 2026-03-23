package com.journal.backend.repository;

import com.journal.backend.model.MacroEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface MacroEventRepository extends JpaRepository<MacroEvent, UUID> {

    List<MacroEvent> findByEventDateBetween(LocalDate from, LocalDate to);

    void deleteByEventDateBetween(LocalDate from, LocalDate to);
}
