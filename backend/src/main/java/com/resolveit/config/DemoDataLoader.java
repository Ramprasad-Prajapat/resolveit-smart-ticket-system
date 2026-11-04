package com.resolveit.config;

import com.resolveit.model.*;
import com.resolveit.repository.CommentRepository;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.NotificationRepository;
import com.resolveit.repository.StatusHistoryRepository;
import com.resolveit.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Loads sample complaints, users, comments, and history for local demonstrations.
 * Never runs in production or when the database already has users.
 */
@Component
public class DemoDataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final CommentRepository commentRepository;
    private final StatusHistoryRepository historyRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${app.seed.demo-password:}")
    private String demoPassword;

    public DemoDataLoader(UserRepository userRepository,
                          ComplaintRepository complaintRepository,
                          CommentRepository commentRepository,
                          StatusHistoryRepository historyRepository,
                          NotificationRepository notificationRepository,
                          PasswordEncoder passwordEncoder,
                          Environment environment) {
        this.userRepository = userRepository;
        this.complaintRepository = complaintRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        if (demoPassword == null || demoPassword.isBlank()) {
            return;
        }

        if (Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
            return;
        }

        if (userRepository.count() > 0) {
            return;
        }

        log.info("Loading DEMO seed data into database...");
        String encodedPass = passwordEncoder.encode(demoPassword);

        // 1. Create Demo Users
        User admin = userRepository.save(new User("Admin User", "admin@resolveit.com", encodedPass, Role.ADMIN));
        User agent1 = userRepository.save(new User("Sarah Agent", "agent1@resolveit.com", encodedPass, Role.AGENT));
        User agent2 = userRepository.save(new User("David Support", "agent2@resolveit.com", encodedPass, Role.AGENT));
        User user1 = userRepository.save(new User("Alice Citizen", "user1@resolveit.com", encodedPass, Role.USER));
        User user2 = userRepository.save(new User("Bob Walker", "user2@resolveit.com", encodedPass, Role.USER));

        // 2. Create 12 Complaints across various statuses
        createSeedComplaint("VPN Disconnection in Branch Office",
                "Frequent disconnects when working remotely via wireguard VPN gateway.",
                ComplaintCategory.NETWORK, ComplaintPriority.HIGH, ComplaintStatus.OPEN,
                user1, null, null);

        createSeedComplaint("Broken Office Chair - Desk 4",
                "Hydraulic cylinder does not hold position and keeps dropping down.",
                ComplaintCategory.HARDWARE, ComplaintPriority.LOW, ComplaintStatus.OPEN,
                user2, null, null);

        createSeedComplaint("Cannot reset forgotten password",
                "Self-service password reset email link arrives expired or invalid.",
                ComplaintCategory.ACCOUNT, ComplaintPriority.MEDIUM, ComplaintStatus.OPEN,
                user1, null, null);

        createSeedComplaint("Slow database queries on billing dashboard",
                "Customer reports summary page takes more than 15 seconds to load.",
                ComplaintCategory.TECHNICAL, ComplaintPriority.HIGH, ComplaintStatus.OPEN,
                user2, null, null);

        createSeedComplaint("Printer offline on 3rd floor",
                "Network printer shows offline error code 50.2 on main display panel.",
                ComplaintCategory.HARDWARE, ComplaintPriority.MEDIUM, ComplaintStatus.IN_PROGRESS,
                user1, agent1, null);

        createSeedComplaint("Request access to analytics warehouse",
                "Need read-only access to customer behavior tables for monthly report.",
                ComplaintCategory.ACCOUNT, ComplaintPriority.LOW, ComplaintStatus.IN_PROGRESS,
                user2, agent2, null);

        createSeedComplaint("Wi-Fi dropping in meeting room B",
                "Access point restarts every hour during video conference sessions.",
                ComplaintCategory.NETWORK, ComplaintPriority.HIGH, ComplaintStatus.IN_PROGRESS,
                user1, agent1, null);

        // Reassign example complaint
        Complaint reassignComplaint = createSeedComplaint("Export to Excel fails on large dates",
                "Generating spreadsheet for 6-month window gives timeout 504.",
                ComplaintCategory.TECHNICAL, ComplaintPriority.MEDIUM, ComplaintStatus.IN_PROGRESS,
                user2, agent2, null);

        // Reassignment history note
        historyRepository.save(new StatusHistory(reassignComplaint, ComplaintStatus.IN_PROGRESS, ComplaintStatus.IN_PROGRESS,
                admin, "DEMO: Reassigned from Sarah Agent to David Support"));

        // Sample alerts: one ASSIGNED_TO_YOU for David Support (agent2), one REASSIGNED_FROM_YOU for Sarah Agent (agent1)
        String ticketNum = "RIT-" + String.format("%05d", reassignComplaint.getId() != null ? reassignComplaint.getId() : 8L);
        notificationRepository.save(new Notification(
                agent2,
                NotificationType.ASSIGNED_TO_YOU,
                "Ticket Assigned",
                "Ticket " + ticketNum + " has been assigned to you.",
                reassignComplaint.getId(),
                ticketNum
        ));

        notificationRepository.save(new Notification(
                agent1,
                NotificationType.REASSIGNED_FROM_YOU,
                "Ticket Reassigned",
                "Ticket " + ticketNum + " was reassigned from you to David Support.",
                reassignComplaint.getId(),
                ticketNum
        ));

        createSeedComplaint("Monitor display flickering intermittently",
                "Replaced HDMI cable but screen still goes blank for two seconds randomly.",
                ComplaintCategory.HARDWARE, ComplaintPriority.MEDIUM, ComplaintStatus.RESOLVED,
                user1, agent1, LocalDateTime.now().minusDays(2));

        createSeedComplaint("2FA token app re-synchronization",
                "New phone requires authenticator app recovery QR code re-issue.",
                ComplaintCategory.ACCOUNT, ComplaintPriority.HIGH, ComplaintStatus.RESOLVED,
                user2, agent2, LocalDateTime.now().minusDays(1));

        createSeedComplaint("Email delivery delay to external domains",
                "Outbound notification emails were delayed by 40 minutes due to queue backlog.",
                ComplaintCategory.NETWORK, ComplaintPriority.MEDIUM, ComplaintStatus.RESOLVED,
                user1, agent1, LocalDateTime.now().minusDays(3));

        createSeedComplaint("Security badge reader door sensor issue",
                "Door sensor latch replaced by building maintenance contractor.",
                ComplaintCategory.OTHER, ComplaintPriority.LOW, ComplaintStatus.RESOLVED,
                user2, agent2, LocalDateTime.now().minusHours(6));

        log.info("DEMO seed data loaded successfully (5 users, 12 complaints, 2 notifications).");
    }

    private Complaint createSeedComplaint(String title, String desc, ComplaintCategory category,
                                          ComplaintPriority priority, ComplaintStatus status,
                                          User creator, User assignee, LocalDateTime resolvedAt) {
        Complaint c = new Complaint(title, desc, category, priority, creator);
        c.setStatus(status);
        c.setAssignedTo(assignee);
        c.setResolvedAt(resolvedAt);
        c = complaintRepository.save(c);

        // Initial creation history row
        historyRepository.save(new StatusHistory(c, null, ComplaintStatus.OPEN, creator, "DEMO: Ticket created"));

        if (status == ComplaintStatus.IN_PROGRESS) {
            historyRepository.save(new StatusHistory(c, ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS,
                    assignee != null ? assignee : creator, "DEMO: Work started"));
            commentRepository.save(new Comment(c, assignee != null ? assignee : creator,
                    "DEMO: Investigating root cause and verifying logs."));
        } else if (status == ComplaintStatus.RESOLVED) {
            historyRepository.save(new StatusHistory(c, ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS,
                    assignee != null ? assignee : creator, "DEMO: Work started"));
            historyRepository.save(new StatusHistory(c, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED,
                    assignee != null ? assignee : creator, "DEMO: Issue fixed and verified"));
            commentRepository.save(new Comment(c, assignee != null ? assignee : creator,
                    "DEMO: Resolution applied. Verified normal operating conditions."));
        }
        return c;
    }
}
