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

    @GetMapping
    public ResponseEntity<List<TradeResponse>> list(Authentication auth) {
        return ResponseEntity.ok(tradeService.list(getEmail(auth)));
    }

    @PostMapping
    public ResponseEntity<TradeResponse> create(Authentication auth,
                                                @Valid @RequestBody TradeRequest request) {
        return ResponseEntity.ok(tradeService.create(getEmail(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TradeResponse> update(Authentication auth,
                                                @PathVariable UUID id,
                                                @Valid @RequestBody TradeRequest request) {
        return ResponseEntity.ok(tradeService.update(getEmail(auth), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) throws IOException {
        tradeService.delete(getEmail(auth), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<AttachmentDto>> listAttachments(Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(tradeService.listAttachments(getEmail(auth), id));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<List<AttachmentDto>> uploadAttachments(
            Authentication auth,
            @PathVariable UUID id,
            @RequestPart("files") List<MultipartFile> files) throws IOException {
        return ResponseEntity.ok(tradeService.uploadAttachments(getEmail(auth), id, files));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    public ResponseEntity<Void> deleteAttachment(Authentication auth,
                                                  @PathVariable UUID id,
                                                  @PathVariable UUID attId) throws IOException {
        tradeService.deleteAttachment(getEmail(auth), id, attId);
        return ResponseEntity.noContent().build();
    }

    private String getEmail(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
