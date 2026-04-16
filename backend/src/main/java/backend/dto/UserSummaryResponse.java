package backend.dto;

import java.time.LocalDateTime;

public record UserSummaryResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean approved,
        LocalDateTime createdAt
) {
}
