package com.journal.backend.controller;

import com.journal.backend.dto.AttachmentDto;
import com.journal.backend.dto.TradeRequest;
import com.journal.backend.dto.TradeResponse;
import com.journal.backend.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    // GET /api/trades — zwraca listę transakcji zalogowanego użytkownika
    @GetMapping
    public ResponseEntity<List<TradeResponse>> list(Authentication auth) {
        return ResponseEntity.ok(tradeService.list(getEmail(auth)));
    }

    // POST /api/trades — tworzy nową transakcję dla zalogowanego użytkownika
    @PostMapping
    public ResponseEntity<TradeResponse> create(Authentication auth,
                                                @Valid @RequestBody TradeRequest request) {
        return ResponseEntity.ok(tradeService.create(getEmail(auth), request));
    }

    // PUT /api/trades/{id} — aktualizuje istniejącą transakcję
    @PutMapping("/{id}")
    public ResponseEntity<TradeResponse> update(Authentication auth,
                                                @PathVariable UUID id,
                                                @Valid @RequestBody TradeRequest request) {
        return ResponseEntity.ok(tradeService.update(getEmail(auth), id, request));
    }

    // DELETE /api/trades/{id} — usuwa transakcję wraz z jej załącznikami
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) throws IOException {
        tradeService.delete(getEmail(auth), id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/trades/{id}/attachments — lista załączników (zrzutów wykresu) transakcji
    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<AttachmentDto>> listAttachments(Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.listAttachments(getEmail(auth), id));
    }

    // POST /api/trades/{id}/attachments — wgrywa pliki graficzne (multipart) do transakcji
    @PostMapping("/{id}/attachments")
    public ResponseEntity<List<AttachmentDto>> uploadAttachments(
            Authentication auth,
            @PathVariable UUID id,
            @RequestPart("files") List<MultipartFile> files) throws IOException {
        return ResponseEntity.ok(tradeService.uploadAttachments(getEmail(auth), id, files));
    }

    // DELETE /api/trades/{id}/attachments/{attId} — usuwa pojedynczy załącznik z transakcji
    @DeleteMapping("/{id}/attachments/{attId}")
    public ResponseEntity<Void> deleteAttachment(Authentication auth,
                                                  @PathVariable UUID id,
                                                  @PathVariable UUID attId) throws IOException {
        tradeService.deleteAttachment(getEmail(auth), id, attId);
        return ResponseEntity.noContent().build();
    }

    // Pomocnicza — wyciąga email z obiektu Authentication (ustawiony przez JwtAuthFilter)
    private String getEmail(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
