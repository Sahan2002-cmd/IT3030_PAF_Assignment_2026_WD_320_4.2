package backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record ResourceResponse(
        Long id,
        String name,
        String type,
        Integer capacity,
        String location,
        String availabilityWindows,
        LocalDate availableFromDate,
        LocalDate availableToDate,
        LocalTime availableFromTime,
        LocalTime availableToTime,
        String status,
        String description,
        String imageDataUrl,
        List<BookingSummaryResponse> bookings,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
