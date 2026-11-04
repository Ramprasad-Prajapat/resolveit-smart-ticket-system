package com.resolveit.dto;

/**
 * Authentication response containing JWT token and basic user details.
 */
public record AuthResponse(
    String token,
    UserResponse user
) {}
