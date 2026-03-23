package com.journal.backend.controller;

import com.journal.backend.repository.PlaybookRepository;
import com.journal.backend.repository.TradeAttachmentRepository;
import com.journal.backend.repository.UserRepository;
import com.journal.backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequiredArgsConstructor
public class FileController {

    private final TradeAttachmentRepository attachmentRepository;
    private final PlaybookRepository playbookRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String filename,
            Authentication auth) throws IOException {

        String email = (String) auth.getPrincipal();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        String fileUrl = "/files/" + filename;

        boolean ownsAttachment = attachmentRepository.existsByUrlAndTradeUserId(fileUrl, user.getId());
        boolean ownsPlaybookImage = playbookRepository.existsByImageUrlAndUserId(fileUrl, user.getId());
        if (!ownsAttachment && !ownsPlaybookImage) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        Path filePath = Path.of(uploadDir).toAbsolutePath().normalize()
                .resolve(filename).normalize();

        if (!filePath.startsWith(Path.of(uploadDir).toAbsolutePath().normalize())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }

        if (!Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
}
