package backend.service;

import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailPasswordResetOtpNotifier implements PasswordResetOtpNotifier {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailPasswordResetOtpNotifier.class);

    private final Optional<JavaMailSender> mailSender;
    private final String fromAddress;
    private final String mailHost;

    public EmailPasswordResetOtpNotifier(
            Optional<JavaMailSender> mailSender,
            @Value("${app.mail.from:no-reply@campushub.com}") String fromAddress,
            @Value("${spring.mail.host:}") String mailHost
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.mailHost = mailHost;
    }

    @Override
    public void sendOtp(String recipientEmail, String recipientName, String otp) {
        if (mailSender.isEmpty() || !StringUtils.hasText(mailHost)) {
            LOGGER.warn("SMTP is not configured. Password reset OTP for {} is {}", recipientEmail, otp);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipientEmail);
        message.setSubject("Campus Hub password reset OTP");
        message.setText(buildEmailBody(recipientName, otp));
        mailSender.get().send(message);
    }

    private String buildEmailBody(String recipientName, String otp) {
        return """
                Hello %s,

                Your Campus Hub password reset OTP is: %s

                This OTP expires in 10 minutes.
                If you did not request a password reset, you can ignore this email.
                """.formatted(recipientName, otp);
    }
}
