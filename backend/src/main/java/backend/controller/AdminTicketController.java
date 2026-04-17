package backend.controller;

import backend.dto.AssignTicketRequest;
import backend.dto.RejectTicketRequest;
import backend.dto.TicketDashboardResponse;
import backend.dto.TicketResponse;
import backend.dto.UserSummaryResponse;
import backend.model.AppUser;
import backend.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/tickets")
public class AdminTicketController {

    private final TicketService ticketService;

    public AdminTicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public ResponseEntity<TicketDashboardResponse> getAllTickets(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(ticketService.getAdminDashboard(user));
    }

    @GetMapping("/technicians")
    public ResponseEntity<List<UserSummaryResponse>> getTechnicians(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(ticketService.getAssignableTechnicians(user));
    }

    @PatchMapping("/{ticketId}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody AssignTicketRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.ok(ticketService.assignTicket(ticketId, request, user));
    }

    @PatchMapping("/{ticketId}/reject")
    public ResponseEntity<TicketResponse> rejectTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody RejectTicketRequest request,
            @AuthenticationPrincipal AppUser user
    ) {
        return ResponseEntity.ok(ticketService.rejectTicket(ticketId, request, user));
    }
}
