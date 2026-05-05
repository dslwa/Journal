package com.journal.backend.controller;

import com.journal.backend.dto.LongTermEntryRequest;
import com.journal.backend.dto.LongTermEntryResponse;
import com.journal.backend.service.LongTermEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/long-term")
@RequiredArgsConstructor
public class LongTermEntryController {

    private final LongTermEntryService longTermEntryService;

    // GET /api/long-term — lista wpisów planowania długoterminowego (THEME, WATCHLIST, GOAL, REVIEW)
    @GetMapping
    public ResponseEntity<List<LongTermEntryResponse>> list(Authentication auth) {
        return ResponseEntity.ok(longTermEntryService.list(getEmail(auth)));
    }

    // POST /api/long-term — tworzy nowy wpis długoterminowy (np. tezę inwestycyjną)
    @PostMapping
    public ResponseEntity<LongTermEntryResponse> create(
            Authentication auth,
            @Valid @RequestBody LongTermEntryRequest request) {
        return ResponseEntity.ok(longTermEntryService.create(getEmail(auth), request));
    }

    // PUT /api/long-term/{id} — aktualizuje istniejący wpis długoterminowy
    @PutMapping("/{id}")
    public ResponseEntity<LongTermEntryResponse> update(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody LongTermEntryRequest request) {
        return ResponseEntity.ok(longTermEntryService.update(getEmail(auth), id, request));
    }

    // DELETE /api/long-term/{id} — usuwa wpis długoterminowy
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        longTermEntryService.delete(getEmail(auth), id);
        return ResponseEntity.noContent().build();
    }

    // Pomocnicza — wyciąga email zalogowanego użytkownika z kontekstu Spring Security
    private String getEmail(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
