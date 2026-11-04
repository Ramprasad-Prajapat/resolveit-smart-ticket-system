package com.resolveit.dto;

import java.util.List;

/**
 * Clean wrapper for paginated API results.
 */
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {}
