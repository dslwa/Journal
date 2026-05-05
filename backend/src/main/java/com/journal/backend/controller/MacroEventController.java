package com.journal.backend.controller;

import com.journal.backend.dto.MacroEventDto;
import com.journal.backend.service.MacroEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/macro-events")
@RequiredArgsConstructor
public class MacroEventController {

    private final MacroEventService macroEventService;

    // GET /api/macro-events — pobiera wydarzenia makroekonomiczne (ForexFactory) z zakresu dat,
    // używane przez kalendarz tradingowy do prezentacji ważnych odczytów ekonomicznych
    @GetMapping
    public ResponseEntity<List<MacroEventDto>> getEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(macroEventService.getEventsForRange(from, to));
    }
}
