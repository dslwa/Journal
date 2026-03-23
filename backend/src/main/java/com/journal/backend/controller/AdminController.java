package com.journal.backend.controller;

import com.journal.backend.dto.AdminUserDto;
import com.journal.backend.dto.SystemConfigDto;
import com.journal.backend.dto.SystemStatsDto;
import com.journal.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @PutMapping("/users/{id}/disable")
    public ResponseEntity<Void> disableUser(Authentication auth, @PathVariable UUID id) {
        adminService.disableUser((String) auth.getPrincipal(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(Authentication auth, @PathVariable UUID id) {
        adminService.deleteUser((String) auth.getPrincipal(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable UUID id, @RequestBody ResetPasswordRequest request) {
        adminService.resetUserPassword(id, request.newPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/config")
    public ResponseEntity<List<SystemConfigDto>> getConfig() {
        return ResponseEntity.ok(adminService.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<Void> updateConfig(@RequestBody List<SystemConfigDto> entries) {
        adminService.updateConfig(entries);
        return ResponseEntity.ok().build();
    }

    public record ResetPasswordRequest(String newPassword) {}
}
