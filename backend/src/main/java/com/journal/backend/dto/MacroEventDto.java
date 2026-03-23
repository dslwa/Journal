package com.journal.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record MacroEventDto(
        UUID id,
        String eventName,
        LocalDate eventDate,
        LocalTime eventTime,
        String country,
        String impact,
        String actual,
        String forecast,
        String previous,
        String currency
) {}
