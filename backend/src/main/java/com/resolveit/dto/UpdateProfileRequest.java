package com.resolveit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for updating the current user's full name.
 */
public record UpdateProfileRequest(
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be 2 to 100 characters")
    String fullName
) {}
