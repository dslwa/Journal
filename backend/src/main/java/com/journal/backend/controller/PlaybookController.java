package com.journal.backend.controller;

import com.journal.backend.dto.PlaybookRequest;
import com.journal.backend.dto.PlaybookResponse;
import com.journal.backend.service.PlaybookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/playbooks", "/api/playbook"})
@RequiredArgsConstructor
public class PlaybookController {

    private final PlaybookService playbookService;

    // GET /api/playbooks — lista playbooków (strategii) zalogowanego użytkownika
    @GetMapping
    public ResponseEntity<List<PlaybookResponse>> list(Authentication auth) {
        return ResponseEntity.ok(playbookService.list(getEmail(auth)));
    }

    // POST /api/playbooks — tworzy nowy playbook
    @PostMapping
    public ResponseEntity<PlaybookResponse> create(Authentication auth,
                                                   @Valid @RequestBody PlaybookRequest request) {
        return ResponseEntity.ok(playbookService.create(getEmail(auth), request));
    }

    // PUT /api/playbooks/{id} — aktualizuje istniejący playbook
    @PutMapping("/{id}")
    public ResponseEntity<PlaybookResponse> update(Authentication auth,
                                                   @PathVariable UUID id,
                                                   @Valid @RequestBody PlaybookRequest request) {
        return ResponseEntity.ok(playbookService.update(getEmail(auth), id, request));
    }

    // POST /api/playbooks/{id}/image — wgrywa obraz ilustracyjny do playbooka
    @PostMapping("/{id}/image")
    public ResponseEntity<Map<String, String>> uploadImage(
            Authentication auth,
            @PathVariable UUID id,
            @RequestPart("image") MultipartFile image) throws IOException {
        String url = playbookService.uploadImage(getEmail(auth), id, image);
        return ResponseEntity.ok(Map.of("imageUrl", url));
    }

    // DELETE /api/playbooks/{id} — usuwa playbook
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        playbookService.delete(getEmail(auth), id);
        return ResponseEntity.noContent().build();
    }

    // Pomocnicza — pobiera email z obiektu Authentication (ustawiony przez JwtAuthFilter)
    private String getEmail(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
