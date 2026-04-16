package backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import static backend.validation.AuthValidationRules.MOBILE_NUMBER_MESSAGE;
import static backend.validation.AuthValidationRules.MOBILE_NUMBER_REGEX;
import static backend.validation.AuthValidationRules.PASSWORD_MESSAGE;
import static backend.validation.AuthValidationRules.PASSWORD_REGEX;

public record SignupRequest(
        @NotBlank(message = "Name is required")
        String name,
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,
        @NotBlank(message = "Password is required")
        @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE)
        String password,
        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = MOBILE_NUMBER_REGEX, message = MOBILE_NUMBER_MESSAGE)
        String mobileNumber,
        @NotBlank(message = "Role is required")
        String role
) {
}
