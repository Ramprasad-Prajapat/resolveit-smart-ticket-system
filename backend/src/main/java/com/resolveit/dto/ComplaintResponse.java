package com.resolveit.dto;

import com.resolveit.model.ComplaintCategory;
import com.resolveit.model.ComplaintPriority;
import com.resolveit.model.ComplaintStatus;
import java.time.LocalDateTime;

/**
 * Detailed complaint response including ticket number and calculated permissions.
 */
public record ComplaintResponse(
    Long id,
    String ticketNumber,
    String title,
    String description,
    ComplaintCategory category,
    ComplaintPriority priority,
    ComplaintStatus status,
    UserSummary createdBy,
    UserSummary assignedTo,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime resolvedAt,
    ComplaintPermissions permissions
) {}
