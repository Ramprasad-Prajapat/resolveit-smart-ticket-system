package com.resolveit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.UserRepository;
import com.resolveit.security.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:resolveit_integration_db;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=integration-test-secret-key-must-be-32-chars-long",
    "app.seed.enabled=false",
    "app.bootstrap-admin.email=",
    "app.bootstrap-admin.password=",
    "app.security.login.max-attempts=3",
    "app.security.login.window-minutes=10",
    "app.security.login.lock-minutes=10"
})
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void cleanState() {
        loginAttemptService.resetAll();
    }

    @Test
    void fullIntegrationScenario() throws Exception {
        // 1. No token -> 401
        mockMvc.perform(get("/api/complaints"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        // 2. Register user1
        String regUser1 = """
            {
              "fullName": "User One",
              "email": "user1@integration.test",
              "password": "Password123"
            }
            """;
        MvcResult regRes1 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regUser1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("user1@integration.test"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andReturn();

        String token1 = extractToken(regRes1);

        // 3. Duplicate email registration -> 409
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regUser1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));

        // 4. Bad request body (short password) -> 400
        String badBody = """
            {
              "fullName": "Bad",
              "email": "bad@integration.test",
              "password": "123"
            }
            """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.password").exists());

        // 5. Register user2
        String regUser2 = """
            {
              "fullName": "User Two",
              "email": "user2@integration.test",
              "password": "Password123"
            }
            """;
        MvcResult regRes2 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regUser2))
                .andExpect(status().isCreated())
                .andReturn();
        String token2 = extractToken(regRes2);

        // 6. Create ADMIN and AGENT directly in database
        User adminUser = userRepository.save(new User("Admin Master", "admin@integration.test",
                passwordEncoder.encode("AdminPass123"), Role.ADMIN));
        User agentUser = userRepository.save(new User("Agent Smith", "agent@integration.test",
                passwordEncoder.encode("AgentPass123"), Role.AGENT));

        // Login as Admin
        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@integration.test\",\"password\":\"AdminPass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = extractToken(adminLoginRes);

        // Login as Agent
        MvcResult agentLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"agent@integration.test\",\"password\":\"AgentPass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String agentToken = extractToken(agentLoginRes);

        // 7. Normal user cannot access admin users endpoint -> 403
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isForbidden());

        // Admin can access admin users endpoint -> 200
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(4))));

        // 8. User1 creates a complaint
        String createComplaintBody = """
            {
              "title": "Broken network switch on floor 2",
              "description": "Port 8 has yellow indicator light and packet drops exceed 40%",
              "category": "NETWORK",
              "priority": "HIGH"
            }
            """;
        MvcResult createRes = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createComplaintBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.ticketNumber").value(matchesPattern("RIT-\\d{5}")))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn();

        JsonNode complaintNode = objectMapper.readTree(createRes.getResponse().getContentAsString());
        long complaintId = complaintNode.get("id").asLong();

        // 9. User1 lists complaints -> sees own complaint
        mockMvc.perform(get("/api/complaints")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(complaintId));

        // 10. User2 lists complaints -> empty (USER sees own only)
        mockMvc.perform(get("/api/complaints")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // 11. User2 tries to view User1's complaint details -> 403
        mockMvc.perform(get("/api/complaints/" + complaintId)
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isForbidden());

        // 12. Agent self-assigns the unassigned complaint
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/assign")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeId\":" + agentUser.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo.id").value(agentUser.getId()));

        // 13. USER cannot directly set status -> 403
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isForbidden());

        // 14. Agent updates status to IN_PROGRESS
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\",\"note\":\"Starting cable test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 15. User adds a comment
        mockMvc.perform(post("/api/complaints/" + complaintId + "/comments")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Please test port 9 as well.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Please test port 9 as well."));

        // 16. Agent updates status to RESOLVED
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\",\"note\":\"Port re-crimped and tested\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        // 17. Verify history has 3 entries: null->OPEN, OPEN->IN_PROGRESS, IN_PROGRESS->RESOLVED
        mockMvc.perform(get("/api/complaints/" + complaintId + "/history")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        // 18. User reopens own RESOLVED complaint (RESOLVED -> OPEN)
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OPEN\",\"note\":\"Issue reoccurred\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.resolvedAt").isEmpty());

        // 19. Pagination, filter, sort
        mockMvc.perform(get("/api/complaints?page=0&size=5&sort=createdAt,desc&status=OPEN&category=NETWORK&priority=HIGH")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));

        // 20. Login throttling: 3 failed attempts locks target email -> returns 429
        String throwawayEmail = "throttle@integration.test";
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + throwawayEmail + "\",\"password\":\"WrongPass1\"}"))
                    .andExpect(status().isUnauthorized());
        }
        // 4th attempt gets 429
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + throwawayEmail + "\",\"password\":\"AnyPassword\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429));

        // 21. Deactivated user cannot log in -> 403
        User deactUser = userRepository.save(new User("Deactivated", "deact@integration.test",
                passwordEncoder.encode("Pass12345"), Role.USER));
        deactUser.setActive(false);
        userRepository.save(deactUser);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"deact@integration.test\",\"password\":\"Pass12345\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is deactivated"));
    }

    @Test
    void reassignAndLiveAlertsIntegrationScenario() throws Exception {
        // Register user, agentA, agentB, admin
        User adminUser = userRepository.save(new User("Admin Master", "admin2@integration.test",
                passwordEncoder.encode("AdminPass123"), Role.ADMIN));
        User agentA = userRepository.save(new User("Agent Alpha", "agenta@integration.test",
                passwordEncoder.encode("AgentPass123"), Role.AGENT));
        User agentB = userRepository.save(new User("Agent Beta", "agentb@integration.test",
                passwordEncoder.encode("AgentPass123"), Role.AGENT));
        User normalUser = userRepository.save(new User("Normal Client", "client@integration.test",
                passwordEncoder.encode("ClientPass123"), Role.USER));

        // Login Admin
        MvcResult adminRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin2@integration.test\",\"password\":\"AdminPass123\"}"))
                .andExpect(status().isOk()).andReturn();
        String adminToken = extractToken(adminRes);

        // Login Agent A
        MvcResult agentARes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"agenta@integration.test\",\"password\":\"AgentPass123\"}"))
                .andExpect(status().isOk()).andReturn();
        String tokenA = extractToken(agentARes);

        // Login Agent B
        MvcResult agentBRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"agentb@integration.test\",\"password\":\"AgentPass123\"}"))
                .andExpect(status().isOk()).andReturn();
        String tokenB = extractToken(agentBRes);

        // Login Normal User
        MvcResult clientRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"client@integration.test\",\"password\":\"ClientPass123\"}"))
                .andExpect(status().isOk()).andReturn();
        String clientToken = extractToken(clientRes);

        // 1. Client creates complaint
        String complaintBody = """
            {
              "title": "Server overheating in rack 4",
              "description": "Temperature alarm sounding on rack unit 12, exhaust fan stopped",
              "category": "TECHNICAL",
              "priority": "HIGH"
            }
            """;
        MvcResult createRes = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(complaintBody))
                .andExpect(status().isCreated())
                .andReturn();
        long complaintId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Agent A self-assigns
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/assign")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeId\":" + agentA.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo.id").value(agentA.getId()));

        // 3. Agent A sets IN_PROGRESS
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\",\"note\":\"Checking cooling unit\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 4. Admin reassigns from Agent A to Agent B
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeId\":" + agentB.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo.id").value(agentB.getId()))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 5. Agent A status change -> 403 Forbidden
        mockMvc.perform(patch("/api/complaints/" + complaintId + "/status")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\",\"note\":\"Trying to resolve\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("This complaint is not assigned to you"));

        // 6. assignedToMe query lists and counts
        mockMvc.perform(get("/api/complaints?assignedToMe=true")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        mockMvc.perform(get("/api/complaints?assignedToMe=true")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(complaintId));

        // 7. Verify history has "Reassigned from Agent Alpha to Agent Beta"
        mockMvc.perform(get("/api/complaints/" + complaintId + "/history")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[-1].note").value(containsString("Reassigned from Agent Alpha to Agent Beta")));

        // 8. Notifications verification
        // Agent A has 1 REASSIGNED_FROM_YOU notification
        MvcResult notifARes = mockMvc.perform(get("/api/notifications/unread")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].type").value("REASSIGNED_FROM_YOU"))
                .andExpect(jsonPath("$[0].message").value(containsString("moved from you to Agent Beta")))
                .andReturn();
        long notifIdA = objectMapper.readTree(notifARes.getResponse().getContentAsString()).get(0).get("id").asLong();

        // Agent B has 1 ASSIGNED_TO_YOU notification
        mockMvc.perform(get("/api/notifications/unread")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].type").value("ASSIGNED_TO_YOU"))
                .andExpect(jsonPath("$[0].message").value(containsString("handled by Agent Alpha before")));

        // Admin has 0 notifications (no self-notifications)
        mockMvc.perform(get("/api/notifications/unread")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // 9. Agent B cannot mark Agent A's notification as read -> 404
        mockMvc.perform(patch("/api/notifications/" + notifIdA + "/read")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Notification not found"));

        // 10. Agent A marks own notification as read -> 204
        mockMvc.perform(patch("/api/notifications/" + notifIdA + "/read")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        // Agent A's unread list is now empty
        mockMvc.perform(get("/api/notifications/unread")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // 11. No token -> 401
        mockMvc.perform(get("/api/notifications/unread"))
                .andExpect(status().isUnauthorized());

        // 12. Health check endpoint -> 200 {"status":"UP"} without token
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    private String extractToken(MvcResult result) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }
}
