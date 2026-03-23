package com.journal.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String saveFile(MultipartFile file, Set<String> allowedTypes) throws IOException {
        Files.createDirectories(Path.of(uploadDir));

        String contentType = Optional.ofNullable(file.getContentType()).orElse("application/octet-stream");
        if (!allowedTypes.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported content type: " + contentType);
        }

        String clean = StringUtils.hasText(file.getOriginalFilename())
                ? Path.of(file.getOriginalFilename()).getFileName().toString()
                : "file";
        String stored = UUID.randomUUID() + "_" + clean.replaceAll("[\\s/\\\\]+", "_");
        Path dest = Path.of(uploadDir, stored);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/files/" + stored;
    }

    public void deleteFile(String url) throws IOException {
        String name = url.replaceFirst("^/files/", "");

        Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(name).normalize();

        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("Path traversal attempt detected");
        }

        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
    }
}
