package backend.service;

import backend.dto.ApprovalResponse;
import backend.dto.AuthResponse;
import backend.dto.LoginRequest;
import backend.dto.SignupRequest;
import backend.dto.UserSummaryResponse;
import backend.model.AppUser;
import backend.model.Role;
import backend.repository.AppUserRepository;
import backend.security.JwtService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AppUserRepository appUserRepository,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.appUserRepository = appUserRepository;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        Role role;
        try {
            role = Role.from(request.role());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN, STUDENT, or TECHNICIAN");
        }

        if (role == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin accounts are created by the system only");
        }

        boolean approved = role != Role.TECHNICIAN;
        AppUser user = new AppUser(
                request.name().trim(),
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()),
                role,
                approved
        );
        AppUser savedUser = appUserRepository.save(user);

        String message = approved
                ? "Signup successful. You can log in now."
                : "Technician signup submitted. Please wait for admin approval before logging in.";

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.isApproved(),
                null,
                message
        );
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email or password"));

        if (user.getRole() == Role.TECHNICIAN && !user.isApproved()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your technician account is waiting for admin approval");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().trim(), request.password())
            );
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email or password");
        } catch (DisabledException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is not active yet");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isApproved(),
                token,
                "Login successful"
        );
    }

    public UserSummaryResponse currentUser(AppUser user) {
        return toSummary(user);
    }

    public List<UserSummaryResponse> getPendingTechnicians() {
        return appUserRepository.findByRoleAndApprovedOrderByCreatedAtAsc(Role.TECHNICIAN, false)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public ApprovalResponse approveTechnician(Long technicianId) {
        AppUser user = appUserRepository.findById(technicianId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found"));

        if (user.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only technician accounts can be approved");
        }

        user.setApproved(true);

        return new ApprovalResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isApproved(),
                "Technician approved successfully"
        );
    }

    private UserSummaryResponse toSummary(AppUser user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isApproved(),
                user.getCreatedAt()
        );
    }
}
