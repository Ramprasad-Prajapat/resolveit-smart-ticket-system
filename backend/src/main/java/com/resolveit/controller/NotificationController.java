package com.resolveit.controller;

import com.resolveit.dto.NotificationResponse;
import com.resolveit.model.User;
import com.resolveit.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing endpoints for checking unread notifications and marking them read.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnread(@AuthenticationPrincipal User currentUser) {
        List<NotificationResponse> list = notificationService.getUnreadNotifications(currentUser);
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        notificationService.markAsRead(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
