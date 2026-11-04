package com.resolveit.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request payload for activating or deactivating a user account.
 */
public record UpdateActiveRequest(
    @NotNull(message = "Active status is required")
    Boolean active
) {}
