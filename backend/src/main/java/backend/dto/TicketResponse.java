package backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TicketResponse(
        Long id,
        String ticketNumber,
        String title,
        String resourceName,
        String location,
        String category,
        String description,
        String priority,
        String status,
        String preferredContactName,
        String preferredContactEmail,
        String preferredContactPhone,
        String resolutionNotes,
        String rejectionReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long createdById,
        String createdByName,
        String createdByEmail,
        Long assignedTechnicianId,
        String assignedTechnicianName,
        boolean canAssign,
        boolean canUpdateStatus,
        boolean canReject,
        boolean canComment,
        List<TicketAttachmentResponse> attachments,
        List<TicketCommentResponse> comments
) {
}
