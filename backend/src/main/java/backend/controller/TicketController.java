package backend.controller;

import backend.dto.CreateTicketRequest;
import backend.dto.TicketCommentRequest;
import backend.dto.TicketCommentResponse;
import backend.dto.TicketDashboardResponse;
import backend.dto.TicketResponse;
import backend.dto.UpdateTicketStatusRequest;
import backend.model.AppUser;
import backend.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(request, user));
    }

    @GetMapping("/my")
    public ResponseEntity<TicketDashboardResponse> getMyTickets(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(ticketService.getStudentDashboard(user));
    }

    @GetMapping("/assigned")
    public ResponseEntity<TicketDashboardResponse> getAssignedTickets(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(ticketService.getTechnicianDashboard(user));
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.ok(ticketService.updateStatus(ticketId, request, user));
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<TicketCommentResponse> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketCommentRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(ticketId, request, user));
    }

    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<TicketCommentResponse> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody TicketCommentRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.ok(ticketService.updateComment(commentId, request, user));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.ok(ticketService.deleteComment(commentId, user));
    }
}
