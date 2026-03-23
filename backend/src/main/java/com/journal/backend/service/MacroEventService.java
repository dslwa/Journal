package com.journal.backend.service;

import com.journal.backend.dto.MacroEventDto;
import com.journal.backend.model.MacroEvent;
import com.journal.backend.repository.MacroEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MacroEventService {

    private final MacroEventRepository macroEventRepository;
    private final RestTemplate restTemplate;

    private static final long CACHE_TTL_HOURS = 6;
    private static final String FF_CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

    private volatile LocalDateTime lastFetchTime = null;

    @Transactional
    public List<MacroEventDto> getEventsForRange(LocalDate from, LocalDate to) {
        if (lastFetchTime == null || lastFetchTime.isBefore(LocalDateTime.now().minusHours(CACHE_TTL_HOURS))) {
            fetchAndCacheEvents();
        }
        return macroEventRepository.findByEventDateBetween(from, to)
                .stream().map(this::toDto).toList();
    }

    @SuppressWarnings("unchecked")
    private void fetchAndCacheEvents() {
        try {
            List<Map<String, Object>> response = restTemplate.getForObject(FF_CALENDAR_URL, List.class);
            if (response == null || response.isEmpty()) return;

            LocalDate feedFrom = null;
            LocalDate feedTo = null;
            for (Map<String, Object> item : response) {
                LocalDate d = parseFfDate(getString(item, "date"));
                if (d != null) {
                    if (feedFrom == null || d.isBefore(feedFrom)) feedFrom = d;
                    if (feedTo == null || d.isAfter(feedTo)) feedTo = d;
                }
            }
            if (feedFrom == null) return;

            macroEventRepository.deleteByEventDateBetween(feedFrom, feedTo);

            for (Map<String, Object> item : response) {
                try {
                    String impact = getString(item, "impact");
                    if (impact == null || impact.equalsIgnoreCase("Holiday")
                            || impact.equalsIgnoreCase("Non-Economic")) {
                        continue;
                    }

                    String dateStr = getString(item, "date");
                    LocalDate eventDate = parseFfDate(dateStr);
                    LocalTime eventTime = parseFfTime(dateStr);
                    String country = getString(item, "country");

                    MacroEvent event = MacroEvent.builder()
                            .eventName(getString(item, "title"))
                            .eventDate(eventDate)
                            .eventTime(eventTime)
                            .country(country)
                            .impact(impact)
                            .actual(getString(item, "actual"))
                            .forecast(getString(item, "forecast"))
                            .previous(getString(item, "previous"))
                            .currency(country)
                            .build();

                    if (event.getEventName() != null && event.getEventDate() != null) {
                        macroEventRepository.save(event);
                    }
                } catch (Exception ignored) {
                }
            }
            lastFetchTime = LocalDateTime.now();
        } catch (Exception e) {
            lastFetchTime = LocalDateTime.now().minusHours(CACHE_TTL_HOURS).plusMinutes(15);
            log.error("ForexFactory calendar error: {}", e.getMessage());
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private LocalDate parseFfDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            OffsetDateTime odt = OffsetDateTime.parse(dateStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            return odt.toLocalDate();
        } catch (Exception e) {
            return null;
        }
    }

    private LocalTime parseFfTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            OffsetDateTime odt = OffsetDateTime.parse(dateStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            return odt.toLocalTime();
        } catch (Exception e) {
            return null;
        }
    }

    private MacroEventDto toDto(MacroEvent e) {
        return new MacroEventDto(
                e.getId(), e.getEventName(), e.getEventDate(), e.getEventTime(),
                e.getCountry(), e.getImpact(), e.getActual(), e.getForecast(),
                e.getPrevious(), e.getCurrency()
        );
    }
}
