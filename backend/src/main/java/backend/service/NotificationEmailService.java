package backend.service;

import backend.model.AppUser;
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
