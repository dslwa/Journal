package com.journal.backend.dto;

import java.util.UUID;

public record MeResponse(UUID id, String username, String email, Double initialBalance, String role) {}
