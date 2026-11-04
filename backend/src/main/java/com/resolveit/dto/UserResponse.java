package com.resolveit.dto;

import com.resolveit.model.Role;
import java.time.LocalDateTime;

/**
 * Detailed user response for profile and admin views.
 */
public record UserResponse(
    Long id,
    String fullName,
    String email,
    Role role,
    boolean active,
    LocalDateTime createdAt
) {}
