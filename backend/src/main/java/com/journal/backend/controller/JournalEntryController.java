package com.journal.backend.controller;

import com.journal.backend.dto.JournalEntryDto;
import com.journal.backend.service.JournalEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalEntryController {

    private final JournalEntryService journalEntryService;

    @GetMapping
    public ResponseEntity<List<JournalEntryDto>> list(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        String email = (String) auth.getPrincipal();
        if (from != null && to != null) {
            return ResponseEntity.ok(journalEntryService.listForUserBetween(email, from, to));
        }
        return ResponseEntity.ok(journalEntryService.listForUser(email));
    }

    @GetMapping("/{date}")
    public ResponseEntity<JournalEntryDto> getByDate(
            Authentication auth,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(journalEntryService.getByDate(email, date));
    }

    @PostMapping
    public ResponseEntity<JournalEntryDto> createOrUpdate(
            Authentication auth,
            @RequestBody JournalEntryDto dto) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(journalEntryService.createOrUpdate(email, dto));
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> delete(
            Authentication auth,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        String email = (String) auth.getPrincipal();
        journalEntryService.delete(email, date);
        return ResponseEntity.noContent().build();
    }
}
