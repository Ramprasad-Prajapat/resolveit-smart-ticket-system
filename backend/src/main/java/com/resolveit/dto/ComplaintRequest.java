package com.resolveit.dto;

import com.resolveit.model.ComplaintCategory;
import com.resolveit.model.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating or editing a complaint.
 */
public record ComplaintRequest(
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be 3 to 100 characters")
    String title,

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be 10 to 2000 characters")
    String description,

    @NotNull(message = "Category is required")
    ComplaintCategory category,

    @NotNull(message = "Priority is required")
    ComplaintPriority priority
) {}
