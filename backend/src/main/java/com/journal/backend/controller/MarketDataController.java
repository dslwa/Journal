package com.journal.backend.controller;

import com.journal.backend.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketDataController {

    private final MarketDataService marketDataService;

    @GetMapping("/price/{symbol}")
    public ResponseEntity<PriceResponse> getPrice(@PathVariable String symbol) {
        Double price = marketDataService.getCurrentPrice(symbol);
        if (price == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new PriceResponse(symbol, price));
    }

    public record PriceResponse(String symbol, Double price) {}
}
