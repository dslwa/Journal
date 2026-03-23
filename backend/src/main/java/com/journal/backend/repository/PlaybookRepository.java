package com.journal.backend.repository;

import com.journal.backend.model.Playbook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaybookRepository extends JpaRepository<Playbook, UUID> {

    List<Playbook> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Playbook> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByImageUrlAndUserId(String imageUrl, UUID userId);
}
