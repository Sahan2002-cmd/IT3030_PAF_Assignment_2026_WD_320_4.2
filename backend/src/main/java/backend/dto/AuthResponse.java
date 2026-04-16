package backend.dto;

public record AuthResponse(
        Long id,
        String name,
        String email,
        String mobileNumber,
        String role,
        boolean approved,
        String token,
        String message
) {
}
