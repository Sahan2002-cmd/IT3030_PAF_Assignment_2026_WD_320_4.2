package backend.service;

import backend.model.AppUser;
import backend.model.FacilityBooking;
import backend.model.IncidentTicket;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class NotificationEmailService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String fromAddress;

    public NotificationEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.from:}") String configuredFromAddress,
            @Value("${app.admin.email:admin@campushub.com}") String adminEmail
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.fromAddress = StringUtils.hasText(configuredFromAddress) ? configuredFromAddress : adminEmail;
    }

    public void sendProfileChangeSummary(AppUser user, String previousEmail, List<String> changes) {
        if (changes == null || changes.isEmpty()) {
            return;
        }

        LinkedHashSet<String> recipients = new LinkedHashSet<>();
        addRecipient(recipients, user.getEmail());
        addRecipient(recipients, previousEmail);

        String message = """
                Hello %s,

                The following changes were made to your Campus Hub account:

                %s

                If you did not make these changes, please contact support immediately.

                Campus Hub
                """.formatted(
                user.getName(),
                changes.stream().map(change -> "- " + change).reduce((left, right) -> left + "\n" + right).orElse("")
        );

        sendEmail(recipients, "Campus Hub account notification", message);
    }

    public void sendTechnicianApproval(AppUser user) {
        LinkedHashSet<String> recipients = new LinkedHashSet<>();
        addRecipient(recipients, user.getEmail());

        String message = """
                Hello %s,

                Your technician account has been approved in Campus Hub.
                You can now sign in and access the technician dashboard.

                Campus Hub
                """.formatted(user.getName());

        sendEmail(recipients, "Campus Hub approval notification", message);
    }

    public void sendTicketStatusUpdate(IncidentTicket ticket, AppUser updatedBy, String previousStatus) {
        if (ticket == null || ticket.getCreatedBy() == null) {
            return;
        }

        LinkedHashSet<String> recipients = new LinkedHashSet<>();
        addRecipient(recipients, ticket.getCreatedBy().getEmail());
        addRecipient(recipients, ticket.getPreferredContactEmail());

        String actorName = updatedBy != null ? updatedBy.getName() : "Campus Hub";
        String actorRole = updatedBy != null ? updatedBy.getRole().name() : "SYSTEM";
        String resolutionSection = StringUtils.hasText(ticket.getResolutionNotes())
                ? "\nResolution notes:\n" + ticket.getResolutionNotes().trim() + "\n"
                : "";
        String rejectionSection = StringUtils.hasText(ticket.getRejectionReason())
                ? "\nRejection reason:\n" + ticket.getRejectionReason().trim() + "\n"
                : "";

        String message = """
                Hello %s,

                Your maintenance ticket has been updated in Campus Hub.

                Ticket number: %s
                Title: %s
                Previous status: %s
                New status: %s
                Updated by: %s (%s)
                Assigned technician: %s
                %s%s
                Please sign in to Campus Hub if you want to review the full ticket conversation.

                Campus Hub
                """.formatted(
                ticket.getCreatedBy().getName(),
                ticket.getTicketNumber(),
                ticket.getTitle(),
                previousStatus,
                ticket.getStatus().name(),
                actorName,
                actorRole,
                ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getName() : "Not assigned",
                resolutionSection,
                rejectionSection
        );

        sendEmail(recipients, "Campus Hub ticket status update", message);
    }

    public void sendBookingDecision(FacilityBooking booking, AppUser reviewedBy) {
        if (booking == null || booking.getRequestedBy() == null) {
            return;
        }

        LinkedHashSet<String> recipients = new LinkedHashSet<>();
        addRecipient(recipients, booking.getRequestedBy().getEmail());

        String reviewerName = reviewedBy != null ? reviewedBy.getName() : "Campus Hub";
        String reasonSection = StringUtils.hasText(booking.getAdminReason())
                ? "\nReason / note:\n" + booking.getAdminReason().trim() + "\n"
                : "";

        String message = """
                Hello %s,

                Your booking request has been reviewed in Campus Hub.

                Resource: %s
                Date: %s
                Time: %s to %s
                Status: %s
                Reviewed by: %s
                Purpose: %s
                Expected attendees: %s
                %s
                Please sign in to Campus Hub if you want to review your bookings.

                Campus Hub
                """.formatted(
                booking.getRequestedBy().getName(),
                booking.getResource().getName(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus().name(),
                reviewerName,
                booking.getPurpose(),
                booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : "-",
                reasonSection
        );

        sendEmail(recipients, "Campus Hub booking update", message);
    }

    private void addRecipient(Collection<String> recipients, String email) {
        if (StringUtils.hasText(email)) {
            recipients.add(email.trim().toLowerCase());
        }
    }

    private void sendEmail(Collection<String> recipients, String subject, String body) {
        if (recipients.isEmpty()) {
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            logger.info(
                    "Notification email skipped because SMTP is not configured. Subject: {} Recipients: {} Body: {}",
                    subject,
                    recipients,
                    body
            );
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (StringUtils.hasText(fromAddress)) {
            message.setFrom(fromAddress);
        }
        message.setTo(recipients.toArray(String[]::new));
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            logger.warn("Failed to send notification email to {}", recipients, ex);
        }
    }
}
