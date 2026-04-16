package backend.service;

public interface PasswordResetOtpNotifier {

    void sendOtp(String recipientEmail, String recipientName, String otp);
}
