package com.journal.backend.controller;

import com.journal.backend.dto.MeResponse;
import com.journal.backend.dto.UpdateBalanceRequest;
import com.journal.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(Authentication auth) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(userService.getMe(email));
    }

    @PutMapping("/users/balance")
    public ResponseEntity<MeResponse> updateBalance(Authentication auth,
                                                     @RequestBody UpdateBalanceRequest request) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(userService.updateBalance(email, request.initialBalance()));
    }
}
