package com.resolveit.service;

import com.resolveit.dto.NotificationResponse;
import com.resolveit.exception.ApiException;
import com.resolveit.model.Notification;
import com.resolveit.model.NotificationType;
import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository);

        user1 = new User("Alice Agent", "alice@test.com", "hash", Role.AGENT);
        user1.setId(10L);

        user2 = new User("Bob Agent", "bob@test.com", "hash", Role.AGENT);
        user2.setId(20L);
    }

    @Test
    void unreadReturnsOnlyCurrentUsersOldestFirstMax5() {
        Notification n1 = new Notification(user1, NotificationType.ASSIGNED_TO_YOU, "Title 1", "Msg 1", 1L, "RIT-00001");
        n1.setId(101L);
        Notification n2 = new Notification(user1, NotificationType.REASSIGNED_FROM_YOU, "Title 2", "Msg 2", 2L, "RIT-00002");
        n2.setId(102L);

        when(notificationRepository.findTop5ByUserIdAndIsReadFalseOrderByCreatedAtAsc(10L))
                .thenReturn(List.of(n1, n2));

        List<NotificationResponse> list = notificationService.getUnreadNotifications(user1);
        assertEquals(2, list.size());
        assertEquals("RIT-00001", list.get(0).ticketNumber());
        assertEquals("RIT-00002", list.get(1).ticketNumber());
        verify(notificationRepository).findTop5ByUserIdAndIsReadFalseOrderByCreatedAtAsc(10L);
    }

    @Test
    void markReadWorks() {
        Notification n = new Notification(user1, NotificationType.ASSIGNED_TO_YOU, "Title", "Msg", 1L, "RIT-00001");
        n.setId(101L);
        assertFalse(n.isRead());

        when(notificationRepository.findByIdAndUserId(101L, 10L)).thenReturn(Optional.of(n));

        notificationService.markAsRead(101L, user1);
        assertTrue(n.isRead());
        verify(notificationRepository).save(n);
    }

    @Test
    void markReadThrowsNotFoundForSomeoneElsesNotification() {
        when(notificationRepository.findByIdAndUserId(999L, 10L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> notificationService.markAsRead(999L, user1));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Notification not found", ex.getMessage());
    }

    @Test
    void longTitlesAreCutTo60Characters() {
        String longTitle = "This is a very long complaint title that exceeds sixty characters easily and needs to be shortened";
        String truncated = NotificationService.truncateTitle(longTitle);
        assertTrue(truncated.length() <= 60);
        assertTrue(truncated.endsWith("..."));

        String shortTitle = "Short title";
        assertEquals("Short title", NotificationService.truncateTitle(shortTitle));
    }
}
