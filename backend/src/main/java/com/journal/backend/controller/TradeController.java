package com.journal.backend.controller;

import com.journal.backend.dto.TradeRequest;
import com.journal.backend.dto.TradeResponse;
import com.journal.backend.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        tradeService.delete(getEmail(auth), id);
        return ResponseEntity.noContent().build();
    }

    private String getEmail(Authentication auth) {
        return (String) auth.getPrincipal();
    }
}
