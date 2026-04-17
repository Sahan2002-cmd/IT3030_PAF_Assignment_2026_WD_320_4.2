package backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(
        @NotNull(message = "Resource is required")
        Long resourceId,
        @NotNull(message = "Booking date is required")
        LocalDate bookingDate,
        @NotNull(message = "Start time is required")
        LocalTime startTime,
        @NotNull(message = "End time is required")
        LocalTime endTime,
        @NotBlank(message = "Purpose is required")
        String purpose,
        @Min(value = 1, message = "Expected attendees must be at least 1")
        Integer expectedAttendees
) {
}
