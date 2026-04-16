package backend;

import backend.dto.LoginRequest;
import backend.dto.ProfileUpdateRequest;
import backend.dto.ResetPasswordWithOtpRequest;
import backend.dto.SignupRequest;
import backend.repository.AppUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppUserRepository appUserRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void studentCanSignupAndLoginImmediately() throws Exception {
        SignupRequest signupRequest = new SignupRequest(
                "Student User",
                "student1@campushub.com",
                "Student@123",
                "0712345678",
                "student"
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.approved").value(true));

        LoginRequest loginRequest = new LoginRequest("student1@campushub.com", "Student@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void technicianNeedsAdminApprovalBeforeLogin() throws Exception {
        SignupRequest technicianSignup = new SignupRequest(
                "Tech User",
                "tech1@campushub.com",
                "Tech@123",
                "0771234567",
                "technician"
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(technicianSignup)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approved").value(false));

        LoginRequest technicianLogin = new LoginRequest("tech1@campushub.com", "Tech@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(technicianLogin)))
                .andExpect(status().isForbidden());

        String adminLoginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("admin@campushub.com", "Admin@123")
                        )))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String adminToken = objectMapper.readTree(adminLoginResponse).get("token").asText();
        Long technicianId = appUserRepository.findByEmailIgnoreCase("tech1@campushub.com").orElseThrow().getId();

        mockMvc.perform(get("/api/admin/technicians/pending")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(patch("/api/admin/technicians/{technicianId}/approve", technicianId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approved").value(true));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(technicianLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void authenticatedUserCanUpdateOwnProfile() throws Exception {
        SignupRequest signupRequest = new SignupRequest(
                "Profile User",
                "profile1@campushub.com",
                "Profile@123",
                "0761234567",
                "student"
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk());

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("profile1@campushub.com", "Profile@123")
                        )))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("token").asText();

        mockMvc.perform(patch("/api/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ProfileUpdateRequest(
                                        "Updated User",
                                        "profile-updated@campushub.com",
                                        "0751234567",
                                        "Profile@123",
                                        "Updated@123",
                                        "Updated@123"
                                )
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated User"))
                .andExpect(jsonPath("$.email").value("profile-updated@campushub.com"))
                .andExpect(jsonPath("$.mobileNumber").value("0751234567"))
                .andExpect(jsonPath("$.token").isNotEmpty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("profile-updated@campushub.com", "Updated@123")
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void signupRequiresValidMobileNumberAndPasswordComplexity() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SignupRequest(
                                        "Invalid Mobile",
                                        "invalid-mobile@campushub.com",
                                        "ValidPass@1",
                                        "12345",
                                        "student"
                                )
                        )))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SignupRequest(
                                        "Invalid Password",
                                        "invalid-password@campushub.com",
                                        "lowercase",
                                        "0781234567",
                                        "student"
                                )
                        )))
                .andExpect(status().isBadRequest());
    }

    @Test
    void userCanResetPasswordWithEmailOtp() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SignupRequest(
                                        "Reset User",
                                        "reset-user@campushub.com",
                                        "Reset@123",
                                        "0791234567",
                                        "student"
                                )
                        )))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"reset-user@campushub.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("An OTP has been sent to your email."));

        String otp = appUserRepository.findByEmailIgnoreCase("reset-user@campushub.com")
                .orElseThrow()
                .getPasswordResetOtp();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ResetPasswordWithOtpRequest(
                                        "reset-user@campushub.com",
                                        otp,
                                        "Fresh@123",
                                        "Fresh@123"
                                )
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful. You can log in now."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("reset-user@campushub.com", "Fresh@123")
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
