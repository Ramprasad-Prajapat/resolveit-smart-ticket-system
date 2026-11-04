package com.resolveit.dto;

import com.resolveit.model.ComplaintStatus;
import java.time.LocalDateTime;

/**
 * Historical status transition entry.
 */
public record StatusHistoryResponse(
    Long id,
    Long complaintId,
    ComplaintStatus oldStatus,
    ComplaintStatus newStatus,
    UserSummary changedBy,
    String note,
    LocalDateTime changedAt
) {}
