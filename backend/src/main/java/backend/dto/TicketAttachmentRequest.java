package backend.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketAttachmentRequest(
        @NotBlank(message = "Attachment file name is required")
        String fileName,
        @NotBlank(message = "Attachment data is required")
        String dataUrl
) {
}
