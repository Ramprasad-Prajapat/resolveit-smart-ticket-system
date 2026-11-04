package com.resolveit.controller;

import com.resolveit.dto.UpdateActiveRequest;
import com.resolveit.dto.UpdateRoleRequest;
import com.resolveit.dto.UserResponse;
import com.resolveit.model.User;
import com.resolveit.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing user administration endpoints reserved for ADMIN accounts.
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/assignable")
    public ResponseEntity<List<UserResponse>> getAssignableUsers() {
        return ResponseEntity.ok(userService.getAssignableUsers());
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.updateRole(id, req.role(), user));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<UserResponse> updateActive(
            @PathVariable Long id,
            @Valid @RequestBody UpdateActiveRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.updateActive(id, req.active(), user));
    }
}
