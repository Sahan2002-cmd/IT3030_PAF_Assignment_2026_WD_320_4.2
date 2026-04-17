package backend.controller;

import backend.dto.ApprovalResponse;
import backend.dto.BookingDecisionRequest;
import backend.dto.BookingResponse;
import backend.dto.CreateResourceRequest;
import backend.dto.MessageResponse;
import backend.dto.ResourceResponse;
import backend.dto.UserSummaryResponse;
import backend.model.AppUser;
import backend.service.AuthService;
import backend.service.BookingService;
import backend.service.ResourceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuthService authService;
    private final ResourceService resourceService;
    private final BookingService bookingService;

    public AdminController(AuthService authService, ResourceService resourceService, BookingService bookingService) {
        this.authService = authService;
        this.resourceService = resourceService;
        this.bookingService = bookingService;
    }

    @GetMapping("/technicians/pending")
    public ResponseEntity<List<UserSummaryResponse>> getPendingTechnicians() {
        return ResponseEntity.ok(authService.getPendingTechnicians());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PatchMapping("/technicians/{technicianId}/approve")
    public ResponseEntity<ApprovalResponse> approveTechnician(@PathVariable Long technicianId) {
        return ResponseEntity.ok(authService.approveTechnician(technicianId));
    }

    @PostMapping("/resources")
    public ResponseEntity<ResourceResponse> createResource(
            @Valid @RequestBody CreateResourceRequest request,
            @AuthenticationPrincipal AppUser adminUser
    ) {
        return ResponseEntity.ok(resourceService.createResource(request, adminUser));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @AuthenticationPrincipal AppUser adminUser,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String status,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long resourceId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String requester
    ) {
        return ResponseEntity.ok(bookingService.getAllBookings(adminUser, status, resourceId, requester));
    }

    @PatchMapping("/bookings/{bookingId}/approve")
    public ResponseEntity<BookingResponse> approveBooking(
            @PathVariable Long bookingId,
            @RequestBody(required = false) BookingDecisionRequest request,
            @AuthenticationPrincipal AppUser adminUser
    ) {
        return ResponseEntity.ok(bookingService.approveBooking(bookingId, request, adminUser));
    }

    @PatchMapping("/bookings/{bookingId}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long bookingId,
            @RequestBody BookingDecisionRequest request,
            @AuthenticationPrincipal AppUser adminUser
    ) {
        return ResponseEntity.ok(bookingService.rejectBooking(bookingId, request, adminUser));
    }

    @PatchMapping("/resources/{resourceId}")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable Long resourceId,
            @Valid @RequestBody CreateResourceRequest request,
            @AuthenticationPrincipal AppUser adminUser
    ) {
        return ResponseEntity.ok(resourceService.updateResource(resourceId, request, adminUser));
    }

    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<MessageResponse> deleteResource(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal AppUser adminUser
    ) {
        return ResponseEntity.ok(resourceService.deleteResource(resourceId, adminUser));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal AppUser adminUser
    ) {
        return ResponseEntity.ok(authService.deleteUser(userId, adminUser));
    }
}
