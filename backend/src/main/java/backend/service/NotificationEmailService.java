package backend.service;

import backend.model.AppUser;
import backend.model.FacilityBooking;
import backend.model.IncidentTicket;
import jakarta.mail.MessagingException;
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
import org.springframework.mail.javamail.MimeMessageHelper;
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
        String statusTone = "APPROVED".equals(booking.getStatus().name()) ? "#dc2626" : "#d97706";
        String statusMessage = "APPROVED".equals(booking.getStatus().name())
                ? "This email serves as your official proof that the booking has been approved."
                : "This email serves as the official record of the booking review decision.";
        String reasonBlock = StringUtils.hasText(booking.getAdminReason())
                ? """
                        <tr>
                          <td style="padding:0 0 14px 0;">
                            <div style="background:#f8fafc;border:1px solid #dbeafe;border-radius:14px;padding:14px 16px;">
                              <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;margin-bottom:6px;">Admin Note</div>
                              <div style="font-size:14px;line-height:1.7;color:#0f172a;">%s</div>
                            </div>
                          </td>
                        </tr>
                        """.formatted(escapeHtml(booking.getAdminReason().trim()))
                : "";

        String htmlMessage = """
                <html>
                  <body style="margin:0;padding:0;background:#eff6ff;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#eff6ff;padding:28px 12px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;box-shadow:0 24px 60px rgba(37,99,235,0.12);">
                            <tr>
                              <td style="background:linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8);padding:28px 32px;">
                                <div style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#dbeafe;">Campus Hub</div>
                                <h1 style="margin:12px 0 6px 0;font-size:28px;line-height:1.2;color:#ffffff;">Booking Decision Notice</h1>
                                <p style="margin:0;font-size:15px;line-height:1.7;color:#e0f2fe;">A professional confirmation for your resource booking request.</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:30px 32px;">
                                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:#334155;">Hello %s,</p>
                                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.8;color:#334155;">
                                  Your booking request has been reviewed by the administration team. %s
                                </p>

                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                                  <tr>
                                    <td colspan="2" style="padding:0 0 8px 0;">
                                      <div style="display:inline-block;background:%s;color:#ffffff;border-radius:999px;padding:9px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                                        %s
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="width:180px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;font-size:13px;font-weight:700;color:#475569;">Resource</td>
                                    <td style="padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;font-size:14px;color:#0f172a;">%s</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;font-size:13px;font-weight:700;color:#475569;">Date</td>
                                    <td style="padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;font-size:14px;color:#0f172a;">%s</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;font-size:13px;font-weight:700;color:#475569;">Time</td>
                                    <td style="padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;font-size:14px;color:#0f172a;">%s to %s</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;font-size:13px;font-weight:700;color:#475569;">Purpose</td>
                                    <td style="padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;font-size:14px;color:#0f172a;">%s</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;font-size:13px;font-weight:700;color:#475569;">Expected Attendees</td>
                                    <td style="padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;font-size:14px;color:#0f172a;">%s</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;font-size:13px;font-weight:700;color:#475569;">Reviewed By</td>
                                    <td style="padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;font-size:14px;color:#0f172a;">%s</td>
                                  </tr>
                                  %s
                                </table>

                                <div style="margin-top:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:16px 18px;">
                                  <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">Booking Proof</div>
                                  <div style="font-size:14px;line-height:1.8;color:#334155;">
                                    Please keep this email as a professional confirmation and proof of your booking decision in Campus Hub.
                                  </div>
                                </div>

                                <p style="margin:20px 0 0 0;font-size:14px;line-height:1.8;color:#475569;">
                                  If needed, you can sign in to Campus Hub to review the full booking details.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                escapeHtml(booking.getRequestedBy().getName()),
                escapeHtml(statusMessage),
                statusTone,
                escapeHtml(booking.getStatus().name()),
                escapeHtml(booking.getResource().getName()),
                escapeHtml(String.valueOf(booking.getBookingDate())),
                escapeHtml(String.valueOf(booking.getStartTime())),
                escapeHtml(String.valueOf(booking.getEndTime())),
                escapeHtml(booking.getPurpose()),
                escapeHtml(String.valueOf(booking.getExpectedAttendees() != null ? booking.getExpectedAttendees() : "-")),
                escapeHtml(reviewerName),
                reasonBlock
        );

        sendHtmlEmail(recipients, "Campus Hub booking confirmation", htmlMessage);
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

    private void sendHtmlEmail(Collection<String> recipients, String subject, String htmlBody) {
        if (recipients.isEmpty()) {
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            logger.info(
                    "HTML notification email skipped because SMTP is not configured. Subject: {} Recipients: {} Body: {}",
                    subject,
                    recipients,
                    htmlBody
            );
            return;
        }

        try {
            var mimeMessage = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            if (StringUtils.hasText(fromAddress)) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(recipients.toArray(String[]::new));
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
        } catch (MailException | MessagingException ex) {
            logger.warn("Failed to send HTML notification email to {}", recipients, ex);
        }
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
