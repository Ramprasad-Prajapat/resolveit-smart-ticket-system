package com.resolveit.dto;

/**
 * Request payload for assigning or unassigning a complaint.
 * A null assigneeId means unassign.
 */
public record AssignRequest(
    Long assigneeId
) {}
