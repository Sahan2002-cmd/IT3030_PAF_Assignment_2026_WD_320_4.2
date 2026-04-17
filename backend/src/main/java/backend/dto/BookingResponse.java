package backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record BookingResponse(
        Long id,
        Long resourceId,
        String resourceName,
        String resourceType,
        String resourceLocation,
        Long requesterId,
        String requesterName,
        String requesterEmail,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        String purpose,
        Integer expectedAttendees,
        String status,
        String adminReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
