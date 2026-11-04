package com.resolveit.service;

import com.resolveit.dto.NotificationResponse;
import com.resolveit.exception.ApiException;
import com.resolveit.model.Notification;
import com.resolveit.model.NotificationType;
import com.resolveit.model.User;
import com.resolveit.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing user notifications and alerts.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification createNotification(User recipient, NotificationType type, String title, String message, Long complaintId, String ticketNumber) {
        if (recipient == null) {
            return null;
        }

        String safeTitle = (title != null && title.length() > 100) ? title.substring(0, 97) + "..." : title;
        String safeMessage = (message != null && message.length() > 500) ? message.substring(0, 497) + "..." : message;

        Notification notification = new Notification(recipient, type, safeTitle, safeMessage, complaintId, ticketNumber);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(User currentUser) {
        return notificationRepository.findTop5ByUserIdAndIsReadFalseOrderByCreatedAtAsc(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markAsRead(Long id, User currentUser) {
        Notification notification = notificationRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    public static String truncateTitle(String title) {
        if (title == null) {
            return "";
        }
        String trimmed = title.trim();
        if (trimmed.length() <= 60) {
            return trimmed;
        }
        return trimmed.substring(0, 57) + "...";
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getComplaintId(),
                n.getTicketNumber(),
                n.getCreatedAt()
        );
    }
}
