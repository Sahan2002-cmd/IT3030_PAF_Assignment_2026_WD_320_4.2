package backend.controller;

import backend.dto.AuthResponse;
import backend.dto.GoogleAuthRequest;
import backend.dto.LoginRequest;
import backend.dto.ProfileUpdateRequest;
import backend.dto.SignupRequest;
import backend.dto.UserSummaryResponse;
import backend.model.AppUser;
import backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryResponse> currentUser(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(authService.currentUser(user));
    }

    @PatchMapping("/me")
    public ResponseEntity<AuthResponse> updateProfile(
            @AuthenticationPrincipal AppUser user,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfile(user, request));
    }
}
