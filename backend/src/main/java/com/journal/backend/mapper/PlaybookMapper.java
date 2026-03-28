package com.journal.backend.mapper;

import com.journal.backend.dto.PlaybookRequest;
import com.journal.backend.dto.PlaybookResponse;
import com.journal.backend.model.Playbook;
import com.journal.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class PlaybookMapper {

    public Playbook toEntity(User user, PlaybookRequest request) {
        return Playbook.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .rules(resolveContent(request))
                .setup(request.getSetup())
                .timeframe(request.getTimeframe())
                .riskNote(request.getRiskNote())
                .tags(request.getTags())
                .checklist(request.getChecklist())
                .build();
    }

    public void updateEntity(Playbook playbook, PlaybookRequest request) {
        playbook.setTitle(request.getTitle());
        playbook.setDescription(request.getDescription());
        playbook.setRules(resolveContent(request));
        playbook.setSetup(request.getSetup());
        playbook.setTimeframe(request.getTimeframe());
        playbook.setRiskNote(request.getRiskNote());
        playbook.setTags(request.getTags());
        playbook.setChecklist(request.getChecklist());
    }

    public PlaybookResponse toResponse(Playbook playbook) {
        return PlaybookResponse.builder()
                .id(playbook.getId())
                .title(playbook.getTitle())
                .description(playbook.getDescription())
                .content(playbook.getRules() == null ? "" : playbook.getRules())
                .rules(playbook.getRules())
                .setup(playbook.getSetup())
                .timeframe(playbook.getTimeframe())
                .riskNote(playbook.getRiskNote())
                .tags(playbook.getTags())
                .checklist(playbook.getChecklist())
                .imageUrl(playbook.getImageUrl())
                .createdAt(playbook.getCreatedAt())
                .updatedAt(playbook.getUpdatedAt())
                .build();
    }

    private String resolveContent(PlaybookRequest request) {
        return request.getContent() != null ? request.getContent() : request.getRules();
    }
}
