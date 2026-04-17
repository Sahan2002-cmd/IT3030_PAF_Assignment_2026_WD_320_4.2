package backend.service;

import backend.dto.ApprovalResponse;
import backend.dto.AuthResponse;
import backend.dto.ForgotPasswordRequest;
import backend.dto.GoogleAuthRequest;
import backend.dto.LoginRequest;
import backend.dto.MessageResponse;
import backend.dto.ProfileUpdateRequest;
import backend.dto.ResetPasswordWithOtpRequest;
import backend.dto.SignupRequest;
import backend.dto.UserSummaryResponse;
import backend.model.AppUser;
import backend.model.Role;
import backend.repository.AppUserRepository;
import backend.security.GoogleTokenVerifierService;
import backend.security.JwtService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.data.domain.Sort;
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
import static backend.validation.AuthValidationRules.isValidPassword;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final NotificationEmailService notificationEmailService;
    private final PasswordResetOtpNotifier passwordResetOtpNotifier;
    private final UserNotificationService userNotificationService;

    public AuthService(
            AppUserRepository appUserRepository,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            GoogleTokenVerifierService googleTokenVerifierService,
            NotificationEmailService notificationEmailService,
            PasswordResetOtpNotifier passwordResetOtpNotifier,
            UserNotificationService userNotificationService
    ) {
        this.appUserRepository = appUserRepository;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.notificationEmailService = notificationEmailService;
        this.passwordResetOtpNotifier = passwordResetOtpNotifier;
        this.userNotificationService = userNotificationService;
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

        return buildAuthResponse(user, jwtService.generateToken(user), "Login successful");
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
    public MessageResponse requestPasswordResetOtp(ForgotPasswordRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase()).orElse(null);

        if (user == null) {
            return new MessageResponse("If that email is registered, an OTP has been sent.");
        }

        String otp = generateOtp();
        user.setPasswordResetOtp(otp);
        user.setPasswordResetOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        passwordResetOtpNotifier.sendOtp(user.getEmail(), user.getName(), otp);

        return new MessageResponse("An OTP has been sent to your email.");
    }

    @Transactional
    public MessageResponse resetPasswordWithOtp(ResetPasswordWithOtpRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email or OTP"));

        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New passwords do not match");
        }

        if (!isValidPassword(request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_MESSAGE);
        }

        if (user.getPasswordResetOtp() == null || user.getPasswordResetOtpExpiresAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP is invalid or expired");
        }

        if (user.getPasswordResetOtpExpiresAt().isBefore(LocalDateTime.now())) {
            clearPasswordResetOtp(user);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP is invalid or expired");
        }

        if (!user.getPasswordResetOtp().equals(request.otp().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email or OTP");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        clearPasswordResetOtp(user);

        return new MessageResponse("Password reset successful. You can log in now.");
    }

    @Transactional
    public AuthResponse updateProfile(AppUser authenticatedUser, ProfileUpdateRequest request) {
        AppUser user = appUserRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String previousName = user.getName();
        String previousEmail = user.getEmail();
        String previousMobileNumber = user.getMobileNumber();
        String nextName = request.name().trim();
        String nextEmail = request.email().trim().toLowerCase();
        String nextMobileNumber = request.mobileNumber().trim();
        List<String> emailNotifications = new ArrayList<>();

        if (!user.getEmail().equalsIgnoreCase(nextEmail) && appUserRepository.existsByEmailIgnoreCase(nextEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        if (!previousName.equals(nextName)) {
            emailNotifications.add("Your name was updated to " + nextName + ".");
        }

        if (!previousEmail.equalsIgnoreCase(nextEmail)) {
            emailNotifications.add("Your email address was updated to " + nextEmail + ".");
        }

        if (!Objects.equals(previousMobileNumber, nextMobileNumber)) {
            emailNotifications.add("Your mobile number was updated.");
        }

        user.setName(nextName);
        user.setEmail(nextEmail);
        user.setMobileNumber(nextMobileNumber);

        if (updatePasswordIfRequested(user, request)) {
            emailNotifications.add("Your password was changed.");
        }

        notificationEmailService.sendProfileChangeSummary(user, previousEmail, emailNotifications);

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

    public List<UserSummaryResponse> getAllUsers() {
        return appUserRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
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
        userNotificationService.notifyUser(
                user,
                "Approval confirmed",
                "Your technician account has been approved.",
                "approval"
        );
        notificationEmailService.sendTechnicianApproval(user);

        return new ApprovalResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isApproved(),
                "Technician approved successfully"
        );
    }

    @Transactional
    public MessageResponse deleteUser(Long userId, AppUser adminUser) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (adminUser != null && user.getId().equals(adminUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }

        appUserRepository.delete(user);
        return new MessageResponse("User deleted successfully.");
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

    private boolean updatePasswordIfRequested(AppUser user, ProfileUpdateRequest request) {
        boolean wantsPasswordChange =
                StringUtils.hasText(request.currentPassword())
                        || StringUtils.hasText(request.newPassword())
                        || StringUtils.hasText(request.confirmNewPassword());

        if (!wantsPasswordChange) {
            return false;
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

        if (!isValidPassword(request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_MESSAGE);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        return true;
    }

    private String generateOtp() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    }

    private void clearPasswordResetOtp(AppUser user) {
        user.setPasswordResetOtp(null);
        user.setPasswordResetOtpExpiresAt(null);
    }
}
