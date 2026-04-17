package backend.dto;

import java.time.LocalDateTime;

public record ResourceResponse(
        Long id,
        String name,
        String type,
        Integer capacity,
        String location,
        String availabilityWindows,
        String status,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
