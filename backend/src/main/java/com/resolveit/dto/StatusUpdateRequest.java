package com.resolveit.dto;

import com.resolveit.model.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for updating the status of a complaint.
 */
public record StatusUpdateRequest(
    @NotNull(message = "Status is required")
    ComplaintStatus status,

    @Size(max = 255, message = "Note must not exceed 255 characters")
    String note
) {}
