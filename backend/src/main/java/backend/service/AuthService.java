package backend.service;

import backend.dto.ApprovalResponse;
import backend.dto.AuthResponse;
import backend.dto.GoogleAuthRequest;
import backend.dto.LoginRequest;
import backend.dto.ProfileUpdateRequest;
import backend.dto.SignupRequest;
import backend.dto.UserSummaryResponse;
import backend.model.AppUser;
import backend.model.Role;
import backend.repository.AppUserRepository;
import backend.security.GoogleTokenVerifierService;
import backend.security.JwtService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import static backend.validation.AuthValidationRules.PASSWORD_MESSAGE;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    public AuthService(
            AppUserRepository appUserRepository,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            GoogleTokenVerifierService googleTokenVerifierService
    ) {
        this.appUserRepository = appUserRepository;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.googleTokenVerifierService = googleTokenVerifierService;
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
                approved,
                request.mobileNumber().trim()
        );
        AppUser savedUser = appUserRepository.save(user);

        String message = approved
                ? "Signup successful. You can log in now."
                : "Technician signup submitted. Please wait for admin approval before logging in.";

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getMobileNumber(),
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
        return buildAuthResponse(user, token, "Login successful");
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleTokenVerifierService.GoogleUserInfo googleUser = googleTokenVerifierService.verify(request.credential());
        AppUser existingUser = appUserRepository.findByEmailIgnoreCase(googleUser.email()).orElse(null);

        if (existingUser != null) {
            if (existingUser.getRole() == Role.TECHNICIAN && !existingUser.isApproved()) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Your technician account is waiting for admin approval"
                );
            }

            return buildAuthResponse(
                    existingUser,
                    jwtService.generateToken(existingUser),
                    "Google login successful"
            );
        }

        Role role;
        try {
            role = Role.from(request.role());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Role is required for first-time Google sign-in and must be STUDENT or TECHNICIAN"
            );
        }

        if (role == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin accounts cannot be created with Google sign-in");
        }

        boolean approved = role != Role.TECHNICIAN;
        AppUser user = new AppUser(
                googleUser.name(),
                googleUser.email(),
                passwordEncoder.encode(UUID.randomUUID().toString()),
                role,
                approved
        );
        AppUser savedUser = appUserRepository.save(user);

        if (!savedUser.canAccessSystem()) {
            return buildAuthResponse(
                    savedUser,
                    null,
                    "Technician account created with Google. Please wait for admin approval before logging in."
            );
        }

        return buildAuthResponse(
                savedUser,
                jwtService.generateToken(savedUser),
                "Google login successful"
        );
    }

    public UserSummaryResponse currentUser(AppUser user) {
        return toSummary(user);
    }

    @Transactional
    public AuthResponse updateProfile(AppUser authenticatedUser, ProfileUpdateRequest request) {
        AppUser user = appUserRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String nextEmail = request.email().trim().toLowerCase();
        String nextName = request.name().trim();
        String nextMobileNumber = request.mobileNumber().trim();

        if (!user.getEmail().equalsIgnoreCase(nextEmail) && appUserRepository.existsByEmailIgnoreCase(nextEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        user.setName(nextName);
        user.setEmail(nextEmail);
        user.setMobileNumber(nextMobileNumber);
        updatePasswordIfRequested(user, request);

        return buildAuthResponse(
                user,
                jwtService.generateToken(user),
                "Profile updated successfully"
        );
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
                user.getMobileNumber(),
                user.getRole().name(),
                user.isApproved(),
                user.getCreatedAt()
        );
    }

    private AuthResponse buildAuthResponse(AppUser user, String token, String message) {
        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getRole().name(),
                user.isApproved(),
                token,
                message
        );
    }

    private void updatePasswordIfRequested(AppUser user, ProfileUpdateRequest request) {
        boolean wantsPasswordChange =
                StringUtils.hasText(request.currentPassword())
                        || StringUtils.hasText(request.newPassword())
                        || StringUtils.hasText(request.confirmNewPassword());

        if (!wantsPasswordChange) {
            return;
        }

        if (!StringUtils.hasText(request.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (!StringUtils.hasText(request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }

        if (!StringUtils.hasText(request.confirmNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please confirm your new password");
        }

        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New passwords do not match");
        }

        if (!backend.validation.AuthValidationRules.isValidPassword(request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_MESSAGE);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
    }
}
