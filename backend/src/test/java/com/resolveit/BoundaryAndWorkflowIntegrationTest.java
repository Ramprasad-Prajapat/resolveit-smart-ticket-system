package com.resolveit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolveit.dto.ComplaintRequest;
import com.resolveit.dto.StatusUpdateRequest;
import com.resolveit.model.*;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.UserRepository;
import com.resolveit.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:resolveit_boundary_test;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=boundary-test-secret-key-must-be-32-chars-long",
        "app.seed.enabled=false",
        "app.bootstrap-admin.email=",
        "app.bootstrap-admin.password="
})
public class BoundaryAndWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private com.resolveit.repository.CommentRepository commentRepository;

    @Autowired
    private com.resolveit.repository.StatusHistoryRepository historyRepository;

    @Autowired
    private com.resolveit.repository.NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User owner;
    private User agent;
    private User admin;
    private String ownerToken;
    private String agentToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        commentRepository.deleteAll();
        historyRepository.deleteAll();
        complaintRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(new User("Ticket Owner", "owner@example.test", passwordEncoder.encode("Pass123"), Role.USER));
        agent = userRepository.save(new User("Active Agent", "agent@example.test", passwordEncoder.encode("Pass123"), Role.AGENT));
        admin = userRepository.save(new User("System Admin", "admin@example.test", passwordEncoder.encode("Pass123"), Role.ADMIN));

        ownerToken = jwtUtil.generateToken(owner);
        agentToken = jwtUtil.generateToken(agent);
        adminToken = jwtUtil.generateToken(admin);
    }

    @Test
    @DisplayName("Boundary Validation: Complaint title 3 and 100 valid, 2 and 101 invalid")
    void boundary_complaintTitleLimits() throws Exception {
        // 2 chars -> 400
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest("ab", "Valid description here", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isBadRequest());

        // 3 chars -> 201
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest("abc", "Valid description here", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isCreated());

        // 100 chars -> 201
        String title100 = "a".repeat(100);
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest(title100, "Valid description here", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isCreated());

        // 101 chars -> 400
        String title101 = "a".repeat(101);
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest(title101, "Valid description here", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Boundary Validation: Description 10 and 2000 valid, 9 and 2001 invalid")
    void boundary_complaintDescriptionLimits() throws Exception {
        // 9 chars -> 400
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest("Valid Title", "123456789", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isBadRequest());

        // 10 chars -> 201
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest("Valid Title", "1234567890", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isCreated());

        // 2000 chars -> 201
        String desc2000 = "d".repeat(2000);
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest("Valid Title", desc2000, ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isCreated());

        // 2001 chars -> 400
        String desc2001 = "d".repeat(2001);
        mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ComplaintRequest("Valid Title", desc2001, ComplaintCategory.TECHNICAL, ComplaintPriority.LOW))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Workflow: Invalid status moves fail; IN_PROGRESS requires assignee; resolved_at lifecycle")
    void workflow_statusTransitionsAndResolvedAt() throws Exception {
        // 1. Create complaint (OPEN)
        Complaint complaint = complaintRepository.save(new Complaint("Workflow Test", "Description for status transitions", ComplaintCategory.TECHNICAL, ComplaintPriority.HIGH, owner));

        // 2. Direct move OPEN -> RESOLVED by unassigned agent -> 403 Forbidden
        mockMvc.perform(patch("/api/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StatusUpdateRequest(ComplaintStatus.RESOLVED, "Trying to jump"))))
                .andExpect(status().isForbidden());

        // 3. Move OPEN -> IN_PROGRESS without assignee by admin -> 400 Bad Request
        mockMvc.perform(patch("/api/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StatusUpdateRequest(ComplaintStatus.IN_PROGRESS, "Trying to start without assignee"))))
                .andExpect(status().isBadRequest());

        // 4. Assign complaint to agent
        mockMvc.perform(patch("/api/complaints/" + complaint.getId() + "/assign")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeId\": " + agent.getId() + "}"))
                .andExpect(status().isOk());

        // 5. Now move to IN_PROGRESS -> 200
        mockMvc.perform(patch("/api/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StatusUpdateRequest(ComplaintStatus.IN_PROGRESS, "Work started"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.resolvedAt").doesNotExist());

        // 6. Move IN_PROGRESS -> RESOLVED -> 200, resolvedAt is populated
        mockMvc.perform(patch("/api/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StatusUpdateRequest(ComplaintStatus.RESOLVED, "Issue fixed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        // 7. Owner reopens RESOLVED -> OPEN -> 200, resolvedAt is cleared
        mockMvc.perform(patch("/api/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StatusUpdateRequest(ComplaintStatus.OPEN, "Reopening, problem persists"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.resolvedAt").doesNotExist());
    }

    @Test
    @DisplayName("Search & Filters: SQL Injection attempt ' OR 1=1 -- is safely treated as literal text")
    void search_sqlInjectionSafe() throws Exception {
        complaintRepository.save(new Complaint("Normal Ticket", "Regular issue description", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, owner));

        mockMvc.perform(get("/api/complaints?search=' OR 1=1 --")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("Search by ticket code RIT-00001 and number")
    void search_byTicketCodeAndNumber() throws Exception {
        Complaint c = complaintRepository.save(new Complaint("Ticket Alpha", "Valid issue description", ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, owner));
        String ticket = "RIT-" + String.format("%05d", c.getId());
        String num = String.valueOf(c.getId());

        mockMvc.perform(get("/api/complaints?search=" + ticket)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].ticketNumber").value(ticket));

        mockMvc.perform(get("/api/complaints?search=" + num)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].ticketNumber").value(ticket));
    }

    @Test
    @DisplayName("Pagination & Sorting: Unknown sort returns 400")
    void pagination_unknownSortReturns400() throws Exception {
        mockMvc.perform(get("/api/complaints?sort=unknownProperty,asc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Deactivated user's token stops working immediately (401)")
    void security_deactivatedUserTokenStopsWorking() throws Exception {
        // Token works while active
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        // Deactivate user
        owner.setActive(false);
        userRepository.save(owner);

        // Next request with same token fails with 401
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Load Smoke Test: Insert ~250 complaints, verify paging total and response time < 2s")
    void loadSmokeTest_250Complaints() throws Exception {
        List<Complaint> batch = new ArrayList<>();
        for (int i = 1; i <= 250; i++) {
            batch.add(new Complaint("Bulk Ticket #" + i, "Bulk testing complaint issue description", ComplaintCategory.TECHNICAL, ComplaintPriority.MEDIUM, owner));
        }
        complaintRepository.saveAll(batch);

        long start = System.currentTimeMillis();
        mockMvc.perform(get("/api/complaints?page=0&size=20")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(250)))
                .andExpect(jsonPath("$.content", hasSize(20)));
        long duration = System.currentTimeMillis() - start;
        assert(duration < 2000);
    }
}
