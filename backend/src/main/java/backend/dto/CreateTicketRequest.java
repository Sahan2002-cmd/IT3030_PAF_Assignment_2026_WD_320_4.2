package backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateTicketRequest(
        @NotBlank(message = "Title is required")
        String title,
        @NotBlank(message = "Resource name is required")
        String resourceName,
        @NotBlank(message = "Location is required")
        String location,
        @NotBlank(message = "Category is required")
        String category,
        @NotBlank(message = "Description is required")
        @Size(max = 2000, message = "Description must be 2000 characters or less")
        String description,
        @NotBlank(message = "Priority is required")
        String priority,
        @NotBlank(message = "Preferred contact name is required")
        String preferredContactName,
        @NotBlank(message = "Preferred contact email is required")
        @Email(message = "Preferred contact email must be valid")
        String preferredContactEmail,
        @NotBlank(message = "Preferred contact phone is required")
        String preferredContactPhone,
        @Valid
        @Size(max = 3, message = "You can upload up to 3 images")
        List<TicketAttachmentRequest> attachments
) {
}
