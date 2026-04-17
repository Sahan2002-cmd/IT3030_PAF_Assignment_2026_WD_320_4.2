package backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateResourceRequest(
        @NotBlank(message = "Resource name is required")
        String name,
        @NotBlank(message = "Resource type is required")
        String type,
        @Min(value = 1, message = "Capacity must be at least 1")
        Integer capacity,
        @NotBlank(message = "Location is required")
        String location,
        @NotNull(message = "Available from date is required")
        LocalDate availableFromDate,
        @NotNull(message = "Available to date is required")
        LocalDate availableToDate,
        @NotNull(message = "Available from time is required")
        LocalTime availableFromTime,
        @NotNull(message = "Available to time is required")
        LocalTime availableToTime,
        @NotBlank(message = "Status is required")
        String status,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description,
        @Size(max = 2_000_000, message = "Image is too large")
        String imageDataUrl
) {
}
