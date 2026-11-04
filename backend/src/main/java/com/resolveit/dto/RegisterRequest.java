package com.resolveit.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new user account.
 */
public record RegisterRequest(
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be 2 to 100 characters")
    String fullName,

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 64, message = "Password must be 8 to 64 characters")
    String password
) {}
