package backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookingSummaryResponse(
        Long id,
        Long requesterId,
        String requesterName,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        String purpose,
        Integer expectedAttendees,
        String status,
        String adminReason
) {
}
