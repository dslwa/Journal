package com.journal.backend.service;

import com.journal.backend.dto.AttachmentDto;
import com.journal.backend.dto.TradeRequest;
import com.journal.backend.dto.TradeResponse;
import com.journal.backend.exception.ResourceNotFoundException;
import com.journal.backend.mapper.TradeMapper;
import com.journal.backend.model.Playbook;
import com.journal.backend.model.Trade;
import com.journal.backend.model.TradeAttachment;
import com.journal.backend.model.User;
import com.journal.backend.repository.PlaybookRepository;
import com.journal.backend.repository.TradeAttachmentRepository;
import com.journal.backend.repository.TradeRepository;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TradeService {

    private final TradeRepository tradeRepository;
    private final UserRepository userRepository;
    private final PlaybookRepository playbookRepository;
    private final TradeAttachmentRepository attachmentRepository;
    private final TradeMapper tradeMapper;
    private final FileUploadService fileUploadService;

    // Pobiera listę wszystkich transakcji użytkownika posortowanych od najnowszej,
    // mapuje je na obiekty odpowiedzi TradeResponse
    @Transactional(readOnly = true)
    public List<TradeResponse> list(String email) {
        User user = getUser(email);
        return tradeRepository.findAllByUserIdOrderByOpenedAtDesc(user.getId())
                .stream()
                .map(tradeMapper::toResponse)
                .toList();
    }

    // Tworzy nową transakcję dla użytkownika — rozwiązuje powiązany playbook (jeśli podano),
    // mapuje dane z żądania na encję Trade i zapisuje w bazie
    @Transactional
    public TradeResponse create(String email, TradeRequest request) {
        User user = getUser(email);
        Playbook playbook = resolvePlaybook(request.getPlaybookId());
        Trade trade = tradeMapper.toEntity(user, request, playbook);
        return tradeMapper.toResponse(tradeRepository.save(trade));
    }

    // Aktualizuje istniejącą transakcję — sprawdza czy należy do użytkownika,
    // aktualizuje wszystkie pola i zapisuje zmiany
    @Transactional
    public TradeResponse update(String email, UUID id, TradeRequest request) {
        Trade trade = getUserTrade(email, id);
        Playbook playbook = resolvePlaybook(request.getPlaybookId());
        tradeMapper.updateEntity(trade, request, playbook);
        return tradeMapper.toResponse(tradeRepository.save(trade));
    }

    // Usuwa transakcję wraz ze wszystkimi jej załącznikami (plikami z dysku i rekordami z bazy)
    @Transactional
    public void delete(String email, UUID id) throws IOException {
        Trade trade = getUserTrade(email, id);
        for (var att : attachmentRepository.findByTradeId(id)) {
            fileUploadService.deleteFile(att.getUrl());
        }
        tradeRepository.delete(trade);
    }

    // Pobiera listę załączników (obrazków) przypisanych do danej transakcji użytkownika
    @Transactional(readOnly = true)
    public List<AttachmentDto> listAttachments(String email, UUID tradeId) {
        ensureOwned(email, tradeId);
        return attachmentRepository.findByTradeId(tradeId).stream()
                .map(this::toAttachmentDto).toList();
    }

    // Przesyła pliki graficzne jako załączniki do transakcji — waliduje typ pliku
    // (tylko JPEG, PNG, WebP, GIF), zapisuje na dysku i tworzy rekordy w bazie
    @Transactional
    public List<AttachmentDto> uploadAttachments(String email, UUID tradeId, List<MultipartFile> files) throws IOException {
        ensureOwned(email, tradeId);
        var allowed = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
        List<TradeAttachment> saved = new ArrayList<>();

        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            String url = fileUploadService.saveFile(f, allowed);
            String ct = Optional.ofNullable(f.getContentType()).orElse("application/octet-stream");
            String filename = f.getOriginalFilename() != null ? f.getOriginalFilename() : "file";

            var att = TradeAttachment.builder()
                    .tradeId(tradeId)
                    .filename(filename)
                    .contentType(ct)
                    .size(f.getSize())
                    .url(url)
                    .build();
            saved.add(attachmentRepository.save(att));
        }

        return saved.stream().map(this::toAttachmentDto).toList();
    }

    // Usuwa pojedynczy załącznik — weryfikuje przynależność do transakcji,
    // kasuje plik z dysku i rekord z bazy
    @Transactional
    public void deleteAttachment(String email, UUID tradeId, UUID attachmentId) throws IOException {
        ensureOwned(email, tradeId);
        var att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));
        if (!att.getTradeId().equals(tradeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment not for this trade");
        }
        fileUploadService.deleteFile(att.getUrl());
        attachmentRepository.delete(att);
    }

    // Pomocnicza — pobiera użytkownika po emailu, rzuca wyjątek jeśli nie znaleziono
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    // Pomocnicza — pobiera transakcję należącą do danego użytkownika, rzuca wyjątek jeśli nie istnieje
    private Trade getUserTrade(String email, UUID tradeId) {
        User user = getUser(email);
        return tradeRepository.findByIdAndUserId(tradeId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trade", tradeId));
    }

    // Pomocnicza — sprawdza czy transakcja należy do użytkownika, rzuca wyjątek jeśli nie
    private void ensureOwned(String email, UUID tradeId) {
        User user = getUser(email);
        if (!tradeRepository.existsByIdAndUserId(tradeId, user.getId())) {
            throw new ResourceNotFoundException("Trade", tradeId);
        }
    }

    // Pomocnicza — pobiera playbook po ID (jeśli podano), rzuca wyjątek jeśli nie istnieje
    private Playbook resolvePlaybook(UUID playbookId) {
        if (playbookId == null) return null;
        return playbookRepository.findById(playbookId)
                .orElseThrow(() -> new ResourceNotFoundException("Playbook", playbookId));
    }

    // Pomocnicza — konwertuje encję załącznika na obiekt DTO do zwrócenia w odpowiedzi API
    private AttachmentDto toAttachmentDto(TradeAttachment a) {
        return new AttachmentDto(a.getId(), a.getUrl(), a.getFilename(), a.getContentType(), a.getSize());
    }
}
