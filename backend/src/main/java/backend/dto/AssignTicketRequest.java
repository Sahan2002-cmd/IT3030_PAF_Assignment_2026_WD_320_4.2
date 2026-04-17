package backend.dto;

import jakarta.validation.constraints.NotNull;

public record AssignTicketRequest(
        @NotNull(message = "Technician is required")
        Long technicianId
) {
}
