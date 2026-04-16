package backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import static backend.validation.AuthValidationRules.PASSWORD_MESSAGE;
import static backend.validation.AuthValidationRules.PASSWORD_REGEX;

public record ResetPasswordWithOtpRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,
        @NotBlank(message = "OTP is required")
        @Pattern(regexp = "^\\d{6}$", message = "OTP must be exactly 6 digits")
        String otp,
        @NotBlank(message = "New password is required")
        @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE)
        String newPassword,
        @NotBlank(message = "Please confirm your new password")
        String confirmNewPassword
) {
}
