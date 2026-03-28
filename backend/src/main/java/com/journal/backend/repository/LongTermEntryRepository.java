package com.journal.backend.repository;

import com.journal.backend.model.LongTermEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LongTermEntryRepository extends JpaRepository<LongTermEntry, UUID> {

    List<LongTermEntry> findAllByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<LongTermEntry> findByIdAndUserId(UUID id, UUID userId);
}
