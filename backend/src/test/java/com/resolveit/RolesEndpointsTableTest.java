package com.resolveit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolveit.dto.ComplaintRequest;
import com.resolveit.model.*;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.NotificationRepository;
import com.resolveit.repository.UserRepository;
import com.resolveit.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:resolveit_roles_test;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=table-test-secret-key-must-be-32-chars-long",
        "app.seed.enabled=false",
        "app.bootstrap-admin.email=",
        "app.bootstrap-admin.password=",
        "app.cors.allowed-origins=http://localhost:4173,http://localhost:5173"
})
public class RolesEndpointsTableTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA;
    private User userB;
    private User agentUser;
    private User adminUser;

    private String tokenUserA;
    private String tokenUserB;
    private String tokenAgent;
    private String tokenAdmin;

    private Complaint complaintA;
    private Notification notificationA;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        complaintRepository.deleteAll();
        userRepository.deleteAll();

        userA = userRepository.save(new User("User Alpha", "usera@example.test", passwordEncoder.encode("Pass123"), Role.USER));
        userB = userRepository.save(new User("User Beta", "userb@example.test", passwordEncoder.encode("Pass123"), Role.USER));
        agentUser = userRepository.save(new User("Agent Alex", "agent@example.test", passwordEncoder.encode("Pass123"), Role.AGENT));
        adminUser = userRepository.save(new User("Admin Root", "admin@example.test", passwordEncoder.encode("Pass123"), Role.ADMIN));

        tokenUserA = jwtUtil.generateToken(userA);
        tokenUserB = jwtUtil.generateToken(userB);
        tokenAgent = jwtUtil.generateToken(agentUser);
        tokenAdmin = jwtUtil.generateToken(adminUser);

        complaintA = complaintRepository.save(new Complaint(
                "User A Complaint",
                "Detailed valid description for complaint A",
                ComplaintCategory.TECHNICAL,
                ComplaintPriority.MEDIUM,
                userA
        ));

        String ticketNumberA = "RIT-" + String.format("%05d", complaintA.getId());
        notificationA = notificationRepository.save(new Notification(
                userA,
                NotificationType.ASSIGNED_TO_YOU,
                "Ticket assigned",
                "Ticket status updated",
                complaintA.getId(),
                ticketNumberA
        ));
    }

    @ParameterizedTest(name = "{0} {1} -> NoToken:{2}, USER:{3}, AGENT:{4}, ADMIN:{5}")
    @CsvSource({
            "GET,    /api/health,               200, 200, 200, 200",
            "GET,    /api/auth/me,              401, 200, 200, 200",
            "GET,    /api/complaints,           401, 200, 200, 200",
            "GET,    /api/complaints/summary,   401, 200, 200, 200",
            "GET,    /api/admin/users,          401, 403, 403, 200",
            "GET,    /api/admin/users/assignable,401, 403, 403, 200",
            "GET,    /api/notifications/unread, 401, 200, 200, 200"
    })
    @DisplayName("Roles x Endpoints Security Matrix")
    void testRolesSecurityMatrix(String method, String endpoint, int noTokenStatus, int userStatus, int agentStatus, int adminStatus) throws Exception {
        // No Token
        mockMvc.perform(get(endpoint)).andExpect(status().is(noTokenStatus));

        // User
        mockMvc.perform(get(endpoint).header("Authorization", "Bearer " + tokenUserA)).andExpect(status().is(userStatus));

        // Agent
        mockMvc.perform(get(endpoint).header("Authorization", "Bearer " + tokenAgent)).andExpect(status().is(agentStatus));

        // Admin
        mockMvc.perform(get(endpoint).header("Authorization", "Bearer " + tokenAdmin)).andExpect(status().is(adminStatus));
    }

    @Test
    @DisplayName("IDOR Prevention: USER cannot read someone else's complaint")
    void idor_userCannotReadOtherUserComplaint() throws Exception {
        // User B tries to read Complaint A -> 403
        mockMvc.perform(get("/api/complaints/" + complaintA.getId())
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("IDOR Prevention: USER cannot edit someone else's complaint")
    void idor_userCannotEditOtherUserComplaint() throws Exception {
        String updatePayload = """
            {
                "title": "Malicious Edit",
                "description": "Attempting unauthorized update",
                "category": "ACCOUNT",
                "priority": "HIGH"
            }
            """;
        mockMvc.perform(put("/api/complaints/" + complaintA.getId())
                        .header("Authorization", "Bearer " + tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("IDOR Prevention: USER cannot delete someone else's complaint")
    void idor_userCannotDeleteOtherUserComplaint() throws Exception {
        mockMvc.perform(delete("/api/complaints/" + complaintA.getId())
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("IDOR Prevention: USER cannot comment on someone else's complaint")
    void idor_userCannotCommentOnOtherUserComplaint() throws Exception {
        String commentPayload = "{\"message\": \"Spam comment on other user ticket\"}";
        mockMvc.perform(post("/api/complaints/" + complaintA.getId() + "/comments")
                        .header("Authorization", "Bearer " + tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(commentPayload))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("IDOR Prevention: USER cannot read history of someone else's complaint")
    void idor_userCannotReadHistoryOfOtherUserComplaint() throws Exception {
        mockMvc.perform(get("/api/complaints/" + complaintA.getId() + "/history")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("IDOR Prevention: USER cannot mark another user's notification as read")
    void idor_userCannotMarkOtherUserNotification() throws Exception {
        mockMvc.perform(patch("/api/notifications/" + notificationA.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Data Safety: No endpoint returns passwordHash or password in JSON response")
    void dataSafety_noPasswordReturned() throws Exception {
        String resMe = mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(resMe.contains("passwordHash"));
        assertFalse(resMe.contains("password"));

        String resUsers = mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(resUsers.contains("passwordHash"));
        assertFalse(resUsers.contains("password"));
    }

    @Test
    @DisplayName("Error Handling: Bad JSON, Bad Enum, and Non-numeric IDs return 400 with no stack traces")
    void errorHandling_returns400WithoutStackTraces() throws Exception {
        // Bad JSON
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ bad_json: "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());

        // Bad Enum
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Valid Title\",\"description\":\"Valid description text\",\"category\":\"INVALID_ENUM\",\"priority\":\"HIGH\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // Non-numeric ID
        mockMvc.perform(get("/api/complaints/not-a-number")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // Unknown ID -> 404
        mockMvc.perform(get("/api/complaints/999999")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("CORS Preflight: Allowed origin gets CORS headers, disallowed does not")
    void corsPreflight_allowedAndDisallowed() throws Exception {
        // Allowed origin 1
        mockMvc.perform(options("/api/complaints")
                        .header("Origin", "http://localhost:4173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4173"));

        // Allowed origin 2 from comma-separated list
        mockMvc.perform(options("/api/complaints")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));

        // Disallowed origin
        mockMvc.perform(options("/api/complaints")
                        .header("Origin", "http://untrusted-external-site.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("Controller Coverage: Direct controller calls for profile, password, comments, history, admin role/active, and delete")
    void controllerEndpoints_fullCoverage() throws Exception {
        // 1. Auth profile update
        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\": \"Alpha Renamed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Alpha Renamed"));

        // 2. Auth change password
        mockMvc.perform(put("/api/auth/password")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\": \"Pass123\", \"newPassword\": \"NewValidPass123\"}"))
                .andExpect(status().isOk());

        // 3. Comments and History
        mockMvc.perform(get("/api/complaints/" + complaintA.getId() + "/comments")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/complaints/" + complaintA.getId() + "/history")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk());

        // 4. Update complaint
        String updateJson = "{\"title\":\"Updated Title Alpha\",\"description\":\"Updated valid description\",\"category\":\"TECHNICAL\",\"priority\":\"HIGH\"}";
        mockMvc.perform(put("/api/complaints/" + complaintA.getId())
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title Alpha"));

        // 5. Admin update role
        mockMvc.perform(patch("/api/admin/users/" + userB.getId() + "/role")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\": \"AGENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("AGENT"));

        // 6. Admin update active
        mockMvc.perform(patch("/api/admin/users/" + userB.getId() + "/active")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        // 7. Delete complaint
        mockMvc.perform(delete("/api/complaints/" + complaintA.getId())
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isNoContent());
    }
}
