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

    @GetMapping
    public ResponseEntity<List<LongTermEntryResponse>> list(Authentication auth) {
        return ResponseEntity.ok(longTermEntryService.list(getEmail(auth)));
    }

    @PostMapping
    public ResponseEntity<LongTermEntryResponse> create(
            Authentication auth,
            @Valid @RequestBody LongTermEntryRequest request) {
        return ResponseEntity.ok(longTermEntryService.create(getEmail(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LongTermEntryResponse> update(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody LongTermEntryRequest request) {
        return ResponseEntity.ok(longTermEntryService.update(getEmail(auth), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        longTermEntryService.delete(getEmail(auth), id);
        return ResponseEntity.noContent().build();
    }

    private String getEmail(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
