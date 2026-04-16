package backend.dto;

import java.time.LocalDateTime;

public record UserSummaryResponse(
        Long id,
        String name,
        String email,
        String mobileNumber,
        String role,
        boolean approved,
        LocalDateTime createdAt
) {
}
