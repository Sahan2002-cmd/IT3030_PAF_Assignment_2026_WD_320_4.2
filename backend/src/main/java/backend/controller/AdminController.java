package backend.controller;

import backend.dto.ApprovalResponse;
import backend.dto.MessageResponse;
import backend.dto.UserSummaryResponse;
import backend.model.AppUser;
import backend.service.AuthService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/technicians/pending")
    public ResponseEntity<List<UserSummaryResponse>> getPendingTechnicians() {
        return ResponseEntity.ok(authService.getPendingTechnicians());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PatchMapping("/technicians/{technicianId}/approve")
    public ResponseEntity<ApprovalResponse> approveTechnician(@PathVariable Long technicianId) {
        return ResponseEntity.ok(authService.approveTechnician(technicianId));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal AppUser adminUser
    ) {
        return ResponseEntity.ok(authService.deleteUser(userId, adminUser));
    }
}
