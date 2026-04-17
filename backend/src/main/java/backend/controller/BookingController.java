package backend.controller;

import backend.dto.BookingDecisionRequest;
import backend.dto.BookingResponse;
import backend.dto.CreateBookingRequest;
import backend.model.AppUser;
import backend.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request, user));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(bookingService.getMyBookings(user));
    }

    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long bookingId,
            @RequestBody(required = false) BookingDecisionRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId, request, user));
    }
}
