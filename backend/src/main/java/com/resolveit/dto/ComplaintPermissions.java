package com.resolveit.dto;

import com.resolveit.model.ComplaintStatus;
import java.util.List;

/**
 * Action permissions returned to the client for the current user and complaint.
 */
public record ComplaintPermissions(
    boolean canEdit,
    boolean canDelete,
    boolean canAssign,
    List<ComplaintStatus> allowedNextStatuses
) {}
