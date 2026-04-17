package backend;

import backend.dto.CreateResourceRequest;
import backend.dto.LoginRequest;
import backend.dto.SignupRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class ResourceCatalogueIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminCanCreateResourceAndStudentsCanFilterResources() throws Exception {
        String adminLoginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin@campushub.com", "Admin@123"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode adminLoginJson = objectMapper.readTree(adminLoginResponse);
        String adminToken = adminLoginJson.get("token").asText();

        mockMvc.perform(post("/api/admin/resources")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateResourceRequest(
                                "Engineering Lab 01",
                                "LAB",
                                40,
                                "Block A - Floor 2",
                                "Mon-Fri 08:00-16:00",
                                "ACTIVE",
                                "Computer lab with 40 workstations"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Engineering Lab 01"))
                .andExpect(jsonPath("$.type").value("LAB"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SignupRequest(
                                "Student Resources",
                                "resource-student@campushub.com",
                                "Student@123",
                                "0771231234",
                                "STUDENT"
                        ))))
                .andExpect(status().isOk());

        String studentLoginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(
                                "resource-student@campushub.com",
                                "Student@123"
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode studentLoginJson = objectMapper.readTree(studentLoginResponse);
        String studentToken = studentLoginJson.get("token").asText();

        mockMvc.perform(get("/api/resources")
                        .header("Authorization", "Bearer " + studentToken)
                        .param("type", "LAB")
                        .param("minCapacity", "30")
                        .param("location", "Block A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Engineering Lab 01"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }
}
