package com.resolveit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for posting a new comment.
 */
public record CommentRequest(
    @NotBlank(message = "Comment message is required")
    @Size(min = 1, max = 1000, message = "Comment must be 1 to 1000 characters")
    String message
) {}
