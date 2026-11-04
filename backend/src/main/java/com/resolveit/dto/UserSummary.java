package com.resolveit.dto;

/**
 * Compact user summary for authors, assignees, and audit actors.
 */
public record UserSummary(
    Long id,
    String fullName,
    String email
) {}
