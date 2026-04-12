package com.journal.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketDataService {

    private final RestTemplate restTemplate;

    @Value("${finnhub.api.key:demo}")
    private String finnhubApiKey;

    @Value("${exchangerate.api.key:}")
    private String exchangeRateApiKey;

    public Double getCurrentPrice(String symbol) {
        String normalized = normalizeSymbol(symbol);
        try {
            if (isForexPair(symbol)) {
                return getForexQuote(normalized);
            }
            return getStockQuote(normalized);
        } catch (Exception e) {
            log.error("Error fetching price for {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Double getForexQuote(String symbol) {
        try {
            if (symbol.length() != 6) return null;
            String base = symbol.substring(0, 3);
            String quote = symbol.substring(3, 6);
            String url = exchangeRateApiKey != null && !exchangeRateApiKey.isBlank()
                    ? String.format("https://v6.exchangerate-api.com/v6/%s/latest/%s", exchangeRateApiKey, base)
                    : String.format("https://api.exchangerate-api.com/v4/latest/%s", base);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            String ratesKey = response != null && response.containsKey("conversion_rates")
                    ? "conversion_rates" : "rates";
            if (response != null && response.containsKey(ratesKey)) {
                Map<String, Object> rates = (Map<String, Object>) response.get(ratesKey);
                Object rate = rates.get(quote);
                if (rate != null) return ((Number) rate).doubleValue();
            }
            return null;
        } catch (RestClientException e) {
            log.error("ExchangeRate-API forex error: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Double getStockQuote(String symbol) {
        try {
            String url = String.format("https://finnhub.io/api/v1/quote?symbol=%s&token=%s", symbol, finnhubApiKey);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("c")) {
                Object currentPrice = response.get("c");
                if (currentPrice != null) return ((Number) currentPrice).doubleValue();
            }
            return null;
        } catch (RestClientException e) {
            log.error("Finnhub stock API error: {}", e.getMessage());
            return null;
        }
    }

    private String normalizeSymbol(String symbol) {
        return symbol.toUpperCase().replace("/", "").replace("-", "").trim();
    }

    private boolean isForexPair(String symbol) {
        String normalized = normalizeSymbol(symbol);
        return normalized.matches("^[A-Z]{6}$") && (
                normalized.startsWith("EUR") || normalized.startsWith("GBP") ||
                normalized.startsWith("AUD") || normalized.startsWith("USD") ||
                normalized.startsWith("CAD") || normalized.startsWith("JPY") ||
                normalized.startsWith("CHF") || normalized.startsWith("NZD"));
    }
}
