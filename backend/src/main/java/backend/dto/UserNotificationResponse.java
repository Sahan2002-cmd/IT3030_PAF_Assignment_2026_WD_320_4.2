package backend.dto;

import java.time.LocalDateTime;

public record UserNotificationResponse(
        Long id,
        String title,
        String message,
        String type,
        boolean read,
        LocalDateTime createdAt
) {
}
