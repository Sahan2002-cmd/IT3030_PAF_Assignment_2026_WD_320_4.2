package backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateResourceRequest(
        @NotBlank(message = "Resource name is required")
        String name,
        @NotBlank(message = "Resource type is required")
        String type,
        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        Integer capacity,
        @NotBlank(message = "Location is required")
        String location,
        @NotBlank(message = "Availability windows are required")
        @Size(max = 2000, message = "Availability windows must be 2000 characters or fewer")
        String availabilityWindows,
        @NotBlank(message = "Status is required")
        String status,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description
) {
}
