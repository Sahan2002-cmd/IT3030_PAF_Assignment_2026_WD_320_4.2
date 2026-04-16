package backend.dto;

public record ApprovalResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean approved,
        String message
) {
}
