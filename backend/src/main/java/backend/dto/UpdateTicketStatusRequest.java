package backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTicketStatusRequest(
        @NotBlank(message = "Status is required")
        String status,
        @Size(max = 2000, message = "Resolution notes must be 2000 characters or less")
        String resolutionNotes
) {
}
