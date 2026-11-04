package com.resolveit.dto;

/**
 * Metric counts shown on the dashboard summary cards.
 */
public record ComplaintSummaryResponse(
    long total,
    long open,
    long inProgress,
    long resolved,
    long unassigned,
    long assignedToMe
) {}
