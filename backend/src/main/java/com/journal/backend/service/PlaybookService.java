package com.journal.backend.service;

import com.journal.backend.dto.PlaybookRequest;
import com.journal.backend.dto.PlaybookResponse;
import com.journal.backend.exception.ResourceNotFoundException;
import com.journal.backend.mapper.PlaybookMapper;
import com.journal.backend.model.Playbook;
import com.journal.backend.model.User;
import com.journal.backend.repository.PlaybookRepository;
import com.journal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlaybookService {

    private static final Set<String> IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private final PlaybookRepository playbookRepository;
    private final UserRepository userRepository;
    private final PlaybookMapper playbookMapper;
    private final FileUploadService fileUploadService;

    // Pobiera listę wszystkich playbooków (strategii) użytkownika posortowanych od najnowszego
    @Transactional(readOnly = true)
    public List<PlaybookResponse> list(String email) {
        User user = getUser(email);
        return playbookRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(playbookMapper::toResponse)
                .toList();
    }

    // Tworzy nowy playbook (strategię) dla użytkownika i zapisuje go w bazie
    @Transactional
    public PlaybookResponse create(String email, PlaybookRequest request) {
        User user = getUser(email);
        Playbook playbook = playbookMapper.toEntity(user, request);
        return playbookMapper.toResponse(playbookRepository.save(playbook));
    }

    // Aktualizuje istniejący playbook — weryfikuje przynależność do użytkownika i zapisuje zmiany
    @Transactional
    public PlaybookResponse update(String email, UUID id, PlaybookRequest request) {
        Playbook playbook = getUserPlaybook(email, id);
        playbookMapper.updateEntity(playbook, request);
        return playbookMapper.toResponse(playbookRepository.save(playbook));
    }

    // Przesyła obraz ilustracyjny do playbooka — waliduje typ pliku, zapisuje na dysku
    // i aktualizuje URL obrazka w playbooku
    @Transactional
    public String uploadImage(String email, UUID id, MultipartFile image) throws IOException {
        Playbook playbook = getUserPlaybook(email, id);
        String url = fileUploadService.saveFile(image, IMAGE_TYPES);
        playbook.setImageUrl(url);
        playbookRepository.save(playbook);
        return url;
    }

    // Usuwa playbook użytkownika po weryfikacji przynależności
    @Transactional
    public void delete(String email, UUID id) {
        Playbook playbook = getUserPlaybook(email, id);
        playbookRepository.delete(playbook);
    }

    // Pomocnicza — pobiera użytkownika po emailu, rzuca wyjątek jeśli nie znaleziono
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    // Pomocnicza — pobiera playbook należący do użytkownika, rzuca wyjątek jeśli nie istnieje
    private Playbook getUserPlaybook(String email, UUID playbookId) {
        User user = getUser(email);
        return playbookRepository.findByIdAndUserId(playbookId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playbook", playbookId));
    }
}
