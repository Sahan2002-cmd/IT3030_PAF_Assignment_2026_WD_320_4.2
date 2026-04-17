package backend.dto;

import java.time.LocalDateTime;

public record TicketCommentResponse(
        Long id,
        String body,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long authorId,
        String authorName,
        String authorRole,
        boolean editable,
        boolean deletable
) {
}
