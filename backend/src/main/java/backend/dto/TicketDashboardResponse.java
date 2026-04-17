package backend.dto;

import java.util.List;

public record TicketDashboardResponse(
        List<TicketResponse> tickets,
        long totalTickets,
        long openTickets,
        long inProgressTickets,
        long resolvedTickets,
        long closedTickets,
        long rejectedTickets
) {
}
