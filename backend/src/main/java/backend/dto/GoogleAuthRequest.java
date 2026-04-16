package backend.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Google credential is required")
        String credential,
        String role
) {
}
