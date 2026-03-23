package com.journal.backend.dto;

import java.util.UUID;

public record AttachmentDto(UUID id, String url, String filename, String contentType, long size) {}
