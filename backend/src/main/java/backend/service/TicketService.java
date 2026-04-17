package backend.service;

import backend.dto.AssignTicketRequest;
import backend.dto.CreateTicketRequest;
import backend.dto.MessageResponse;
import backend.dto.RejectTicketRequest;
import backend.dto.TicketAttachmentRequest;
import backend.dto.TicketAttachmentResponse;
import backend.dto.TicketCommentRequest;
import backend.dto.TicketCommentResponse;
import backend.dto.TicketDashboardResponse;
import backend.dto.TicketResponse;
import backend.dto.UpdateTicketStatusRequest;
import backend.model.AppUser;
import backend.model.IncidentTicket;
import backend.model.Role;
import backend.model.TicketAttachment;
import backend.model.TicketCategory;
import backend.model.TicketComment;
import backend.model.TicketPriority;
import backend.model.TicketStatus;
import backend.repository.AppUserRepository;
import backend.repository.IncidentTicketRepository;
import backend.repository.TicketCommentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TicketService {

    private final IncidentTicketRepository incidentTicketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final AppUserRepository appUserRepository;

    public TicketService(
            IncidentTicketRepository incidentTicketRepository,
            TicketCommentRepository ticketCommentRepository,
            AppUserRepository appUserRepository
    ) {
        this.incidentTicketRepository = incidentTicketRepository;
        this.ticketCommentRepository = ticketCommentRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, AppUser createdBy) {
        IncidentTicket ticket = new IncidentTicket();
        ticket.setTicketNumber(nextTicketNumber());
        ticket.setTitle(request.title().trim());
        ticket.setResourceName(request.resourceName().trim());
        ticket.setLocation(request.location().trim());
        ticket.setCategory(parseCategory(request.category()));
        ticket.setDescription(request.description().trim());
        ticket.setPriority(parsePriority(request.priority()));
        ticket.setPreferredContactName(request.preferredContactName().trim());
        ticket.setPreferredContactEmail(request.preferredContactEmail().trim().toLowerCase());
        ticket.setPreferredContactPhone(request.preferredContactPhone().trim());
        ticket.setCreatedBy(createdBy);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setAttachments(mapAttachments(request.attachments()));
        IncidentTicket saved = incidentTicketRepository.save(ticket);
        return toResponse(saved, createdBy);
    }

    @Transactional(readOnly = true)
    public TicketDashboardResponse getStudentDashboard(AppUser user) {
        List<TicketResponse> tickets = incidentTicketRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(ticket -> toResponse(ticket, user))
                .toList();
        return toDashboard(tickets);
    }

    @Transactional(readOnly = true)
    public TicketDashboardResponse getTechnicianDashboard(AppUser user) {
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only technicians can access assigned tickets");
        }

        List<TicketResponse> tickets = incidentTicketRepository.findByAssignedTechnicianIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(ticket -> toResponse(ticket, user))
                .toList();
        return toDashboard(tickets);
    }

    @Transactional(readOnly = true)
    public TicketDashboardResponse getAdminDashboard(AppUser user) {
        requireAdmin(user);
        List<TicketResponse> tickets = incidentTicketRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ticket -> toResponse(ticket, user))
                .toList();
        return toDashboard(tickets);
    }

    @Transactional
    public TicketResponse assignTicket(Long ticketId, AssignTicketRequest request, AppUser user) {
        requireAdmin(user);
        IncidentTicket ticket = findTicket(ticketId);
        AppUser technician = appUserRepository.findById(request.technicianId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN || !technician.isApproved()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned user must be an approved technician");
        }

        ticket.setAssignedTechnician(technician);
        ticket.touch();
        return toResponse(ticket, user);
    }

    @Transactional
    public TicketResponse rejectTicket(Long ticketId, RejectTicketRequest request, AppUser user) {
        requireAdmin(user);
        IncidentTicket ticket = findTicket(ticketId);
        ensureNotClosed(ticket);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(request.reason().trim());
        ticket.setResolutionNotes(null);
        ticket.touch();
        return toResponse(ticket, user);
    }

    @Transactional
    public TicketResponse updateStatus(Long ticketId, UpdateTicketStatusRequest request, AppUser user) {
        IncidentTicket ticket = findTicket(ticketId);
        ensureCanUpdateStatus(ticket, user);

        TicketStatus nextStatus = parseStatus(request.status());
        String resolutionNotes = StringUtils.hasText(request.resolutionNotes())
                ? request.resolutionNotes().trim()
                : ticket.getResolutionNotes();
        validateStatusTransition(ticket, nextStatus, resolutionNotes);

        ticket.setStatus(nextStatus);
        if (nextStatus != TicketStatus.REJECTED) {
            ticket.setRejectionReason(null);
        }
        if (StringUtils.hasText(resolutionNotes)) {
            ticket.setResolutionNotes(resolutionNotes);
        } else if (nextStatus == TicketStatus.RESOLVED || nextStatus == TicketStatus.CLOSED) {
            ticket.setResolutionNotes(ticket.getResolutionNotes());
        }
        ticket.touch();
        return toResponse(ticket, user);
    }

    @Transactional
    public TicketCommentResponse addComment(Long ticketId, TicketCommentRequest request, AppUser user) {
        IncidentTicket ticket = findTicket(ticketId);
        ensureCanAccessTicket(ticket, user);

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(user);
        comment.setBody(request.body().trim());
        ticket.getComments().add(comment);
        ticket.touch();
        TicketComment saved = ticketCommentRepository.save(comment);
        return toCommentResponse(saved, user);
    }

    @Transactional
    public TicketCommentResponse updateComment(Long commentId, TicketCommentRequest request, AppUser user) {
        TicketComment comment = findComment(commentId);
        ensureCanAccessTicket(comment.getTicket(), user);
        ensureCanManageComment(comment, user);
        comment.setBody(request.body().trim());
        comment.touch();
        comment.getTicket().touch();
        return toCommentResponse(comment, user);
    }

    @Transactional
    public MessageResponse deleteComment(Long commentId, AppUser user) {
        TicketComment comment = findComment(commentId);
        ensureCanAccessTicket(comment.getTicket(), user);
        ensureCanManageComment(comment, user);
        comment.getTicket().touch();
        ticketCommentRepository.delete(comment);
        return new MessageResponse("Comment deleted successfully.");
    }

    @Transactional(readOnly = true)
    public List<backend.dto.UserSummaryResponse> getAssignableTechnicians(AppUser user) {
        requireAdmin(user);
        return appUserRepository.findByRoleAndApprovedOrderByCreatedAtAsc(Role.TECHNICIAN, true)
                .stream()
                .map(account -> new backend.dto.UserSummaryResponse(
                        account.getId(),
                        account.getName(),
                        account.getEmail(),
                        account.getMobileNumber(),
                        account.getRole().name(),
                        account.isApproved(),
                        account.getCreatedAt()
                ))
                .toList();
    }

    private void ensureCanUpdateStatus(IncidentTicket ticket, AppUser user) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isAssignedTechnician = ticket.getAssignedTechnician() != null
                && Objects.equals(ticket.getAssignedTechnician().getId(), user.getId());

        if (!isAdmin && !isAssignedTechnician) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to update this ticket");
        }
    }

    private void validateStatusTransition(IncidentTicket ticket, TicketStatus nextStatus, String resolutionNotes) {
        TicketStatus current = ticket.getStatus();
        if (nextStatus == TicketStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use the rejection action for rejected tickets");
        }

        if (current == TicketStatus.REJECTED || current == TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This ticket can no longer change status");
        }

        if (nextStatus == TicketStatus.IN_PROGRESS && ticket.getAssignedTechnician() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assign a technician before starting work");
        }

        if (current == TicketStatus.OPEN && nextStatus != TicketStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open tickets must move to In Progress first");
        }

        if (current == TicketStatus.IN_PROGRESS && nextStatus != TicketStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "In Progress tickets must move to Resolved next");
        }

        if (current == TicketStatus.RESOLVED && nextStatus != TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolved tickets must move to Closed next");
        }

        if (nextStatus == TicketStatus.RESOLVED && !StringUtils.hasText(resolutionNotes)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolution notes are required to resolve a ticket");
        }
    }

    private void ensureCanAccessTicket(IncidentTicket ticket, AppUser user) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = Objects.equals(ticket.getCreatedBy().getId(), user.getId());
        boolean isAssignedTechnician = ticket.getAssignedTechnician() != null
                && Objects.equals(ticket.getAssignedTechnician().getId(), user.getId());

        if (!isAdmin && !isOwner && !isAssignedTechnician) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this ticket");
        }
    }

    private void ensureCanManageComment(TicketComment comment, AppUser user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (!Objects.equals(comment.getAuthor().getId(), user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit or delete your own comments");
        }
    }

    private IncidentTicket findTicket(Long ticketId) {
        return incidentTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    private TicketComment findComment(Long commentId) {
        return ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
    }

    private void ensureNotClosed(IncidentTicket ticket) {
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Closed tickets cannot be modified");
        }
    }

    private void requireAdmin(AppUser user) {
        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required");
        }
    }

    private TicketPriority parsePriority(String value) {
        try {
            return TicketPriority.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ticket priority");
        }
    }

    private TicketCategory parseCategory(String value) {
        try {
            return TicketCategory.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ticket category");
        }
    }

    private TicketStatus parseStatus(String value) {
        try {
            return TicketStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ticket status");
        }
    }

    private List<TicketAttachment> mapAttachments(List<TicketAttachmentRequest> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }

        return attachments.stream()
                .map(attachment -> {
                    String dataUrl = attachment.dataUrl().trim();
                    if (!dataUrl.startsWith("data:image/")) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachments must be image data URLs");
                    }
                    return new TicketAttachment(attachment.fileName().trim(), dataUrl);
                })
                .toList();
    }

    private String nextTicketNumber() {
        return "INC-" + System.currentTimeMillis();
    }

    private TicketDashboardResponse toDashboard(List<TicketResponse> tickets) {
        return new TicketDashboardResponse(
                tickets,
                tickets.size(),
                tickets.stream().filter(ticket -> "OPEN".equals(ticket.status())).count(),
                tickets.stream().filter(ticket -> "IN_PROGRESS".equals(ticket.status())).count(),
                tickets.stream().filter(ticket -> "RESOLVED".equals(ticket.status())).count(),
                tickets.stream().filter(ticket -> "CLOSED".equals(ticket.status())).count(),
                tickets.stream().filter(ticket -> "REJECTED".equals(ticket.status())).count()
        );
    }

    private TicketResponse toResponse(IncidentTicket ticket, AppUser viewer) {
        boolean isAdmin = viewer.getRole() == Role.ADMIN;
        boolean isAssignedTechnician = ticket.getAssignedTechnician() != null
                && Objects.equals(ticket.getAssignedTechnician().getId(), viewer.getId());
        boolean isOwner = Objects.equals(ticket.getCreatedBy().getId(), viewer.getId());

        return new TicketResponse(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getTitle(),
                ticket.getResourceName(),
                ticket.getLocation(),
                ticket.getCategory().name(),
                ticket.getDescription(),
                ticket.getPriority().name(),
                ticket.getStatus().name(),
                ticket.getPreferredContactName(),
                ticket.getPreferredContactEmail(),
                ticket.getPreferredContactPhone(),
                ticket.getResolutionNotes(),
                ticket.getRejectionReason(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getCreatedBy().getId(),
                ticket.getCreatedBy().getName(),
                ticket.getCreatedBy().getEmail(),
                ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getId() : null,
                ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getName() : null,
                isAdmin,
                isAdmin || isAssignedTechnician,
                isAdmin,
                isAdmin || isAssignedTechnician || isOwner,
                ticket.getAttachments().stream()
                        .map(attachment -> new TicketAttachmentResponse(attachment.getFileName(), attachment.getDataUrl()))
                        .toList(),
                ticket.getComments().stream()
                        .map(comment -> toCommentResponse(comment, viewer))
                        .toList()
        );
    }

    private TicketCommentResponse toCommentResponse(TicketComment comment, AppUser viewer) {
        boolean canManage = viewer.getRole() == Role.ADMIN || Objects.equals(comment.getAuthor().getId(), viewer.getId());
        return new TicketCommentResponse(
                comment.getId(),
                comment.getBody(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                comment.getAuthor().getId(),
                comment.getAuthor().getName(),
                comment.getAuthor().getRole().name(),
                canManage,
                canManage
        );
    }
}
