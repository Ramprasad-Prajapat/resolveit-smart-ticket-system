package com.resolveit.dto;

import com.resolveit.model.Role;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for changing another user's role.
 */
public record UpdateRoleRequest(
    @NotNull(message = "Role is required")
    Role role
) {}
