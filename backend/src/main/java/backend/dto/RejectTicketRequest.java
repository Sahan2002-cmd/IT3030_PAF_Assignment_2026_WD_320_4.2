package backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectTicketRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(max = 1000, message = "Rejection reason must be 1000 characters or less")
        String reason
) {
}
