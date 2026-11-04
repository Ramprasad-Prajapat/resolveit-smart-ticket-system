package com.resolveit.dto;

import java.time.LocalDateTime;

/**
 * Comment details with author summary.
 */
public record CommentResponse(
    Long id,
    Long complaintId,
    UserSummary author,
    String message,
    LocalDateTime createdAt
) {}
