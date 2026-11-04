package com.resolveit.dto;

import com.resolveit.model.NotificationType;
import java.time.LocalDateTime;

/**
 * DTO representing an alert notification response.
 */
public record NotificationResponse(
    Long id,
    NotificationType type,
    String title,
    String message,
    Long complaintId,
    String ticketNumber,
    LocalDateTime createdAt
) {}
