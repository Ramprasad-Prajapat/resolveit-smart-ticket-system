package com.resolveit.service;

import com.resolveit.dto.*;
import com.resolveit.exception.ApiException;
import com.resolveit.model.*;
import com.resolveit.repository.CommentRepository;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.StatusHistoryRepository;
import com.resolveit.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private StatusHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    private ComplaintService complaintService;

    private User user1;
    private User user2;
    private User agentA;
    private User agentB;
    private User admin;

    @BeforeEach
    void setUp() {
        complaintService = new ComplaintService(
                complaintRepository,
                commentRepository,
                historyRepository,
                userRepository,
                notificationService
        );

        user1 = new User("User One", "user1@test.com", "hash", Role.USER);
        user1.setId(10L);

        user2 = new User("User Two", "user2@test.com", "hash", Role.USER);
        user2.setId(20L);

        agentA = new User("Agent Alpha", "agentA@test.com", "hash", Role.AGENT);
        agentA.setId(30L);

        agentB = new User("Agent Beta", "agentB@test.com", "hash", Role.AGENT);
        agentB.setId(35L);

        admin = new User("Admin Root", "admin@test.com", "hash", Role.ADMIN);
        admin.setId(40L);
    }

    @Test
    void createComplaintWritesInitialHistory() {
        ComplaintRequest req = new ComplaintRequest("Test Title", "Valid 10+ characters description",
                ComplaintCategory.TECHNICAL, ComplaintPriority.HIGH);

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> {
            Complaint c = inv.getArgument(0);
            c.setId(101L);
            return c;
        });

        ComplaintResponse res = complaintService.create(req, user1);
        assertNotNull(res);
        assertEquals("RIT-00101", res.ticketNumber());
        assertEquals(ComplaintStatus.OPEN, res.status());
        verify(historyRepository).save(any(StatusHistory.class));
    }

    @Test
    void getByIdScopingByRole() {
        Complaint complaint = new Complaint("Title", "Description is long enough",
                ComplaintCategory.TECHNICAL, ComplaintPriority.MEDIUM, user1);
        complaint.setId(1L);

        when(complaintRepository.findById(1L)).thenReturn(Optional.of(complaint));

        assertNotNull(complaintService.getById(1L, user1));
        assertNotNull(complaintService.getById(1L, agentA));
        assertNotNull(complaintService.getById(1L, admin));

        ApiException ex = assertThrows(ApiException.class, () -> complaintService.getById(1L, user2));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void userCanEditOwnOpenComplaintOnly() {
        Complaint complaint = new Complaint("Old Title", "Valid description for complaint",
                ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, user1);
        complaint.setId(1L);

        when(complaintRepository.findById(1L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        ComplaintRequest req = new ComplaintRequest("New Title", "Updated long description",
                ComplaintCategory.TECHNICAL, ComplaintPriority.HIGH);

        ComplaintResponse res = complaintService.updateComplaint(1L, req, user1);
        assertEquals("New Title", res.title());

        ApiException exAgent = assertThrows(ApiException.class, () -> complaintService.updateComplaint(1L, req, agentA));
        assertEquals(HttpStatus.FORBIDDEN, exAgent.getStatus());

        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        ApiException exUser = assertThrows(ApiException.class, () -> complaintService.updateComplaint(1L, req, user1));
        assertEquals(HttpStatus.CONFLICT, exUser.getStatus());

        ComplaintResponse adminRes = complaintService.updateComplaint(1L, req, admin);
        assertEquals("New Title", adminRes.title());
    }

    @Test
    void statusTransitionRulesAndResolvedAt() {
        Complaint complaint = new Complaint("Title", "Valid description text",
                ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, user1);
        complaint.setId(1L);
        complaint.setAssignedTo(agentA);

        when(complaintRepository.findById(1L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        StatusUpdateRequest toProgress = new StatusUpdateRequest(ComplaintStatus.IN_PROGRESS, "Starting");
        ComplaintResponse r1 = complaintService.updateStatus(1L, toProgress, agentA);
        assertEquals(ComplaintStatus.IN_PROGRESS, r1.status());
        assertNull(complaint.getResolvedAt());

        StatusUpdateRequest toResolved = new StatusUpdateRequest(ComplaintStatus.RESOLVED, "Done");
        ComplaintResponse r2 = complaintService.updateStatus(1L, toResolved, agentA);
        assertEquals(ComplaintStatus.RESOLVED, r2.status());
        assertNotNull(complaint.getResolvedAt());

        StatusUpdateRequest toReopen = new StatusUpdateRequest(ComplaintStatus.OPEN, "Reopening");
        ComplaintResponse r3 = complaintService.updateStatus(1L, toReopen, user1);
        assertEquals(ComplaintStatus.OPEN, r3.status());
        assertNull(complaint.getResolvedAt());

        verify(historyRepository, atLeast(3)).save(any(StatusHistory.class));
    }

    @Test
    void previousAgentStatusChangeThrows403() {
        Complaint complaint = new Complaint("Title", "Valid description text",
                ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, user1);
        complaint.setId(1L);
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaint.setAssignedTo(agentB); // Assigned to Agent B, not Agent A

        when(complaintRepository.findById(1L)).thenReturn(Optional.of(complaint));

        StatusUpdateRequest req = new StatusUpdateRequest(ComplaintStatus.RESOLVED, "Trying to resolve");
        ApiException ex = assertThrows(ApiException.class, () -> complaintService.updateStatus(1L, req, agentA));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("This complaint is not assigned to you", ex.getMessage());
    }

    @Test
    void adminReassignAgentAToAgentB() {
        Complaint complaint = new Complaint("Network Down", "Office network switch failed",
                ComplaintCategory.TECHNICAL, ComplaintPriority.HIGH, user1);
        complaint.setId(12L);
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaint.setAssignedTo(agentA);

        when(complaintRepository.findById(12L)).thenReturn(Optional.of(complaint));
        when(userRepository.findById(35L)).thenReturn(Optional.of(agentB));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignRequest req = new AssignRequest(agentB.getId());
        ComplaintResponse res = complaintService.assignComplaint(12L, req, admin);

        assertEquals(agentB.getId(), res.assignedTo().id());
        assertEquals(ComplaintStatus.IN_PROGRESS, res.status());

        // Verify history row
        ArgumentCaptor<StatusHistory> historyCaptor = ArgumentCaptor.forClass(StatusHistory.class);
        verify(historyRepository).save(historyCaptor.capture());
        StatusHistory h = historyCaptor.getValue();
        assertEquals(ComplaintStatus.IN_PROGRESS, h.getOldStatus());
        assertEquals(ComplaintStatus.IN_PROGRESS, h.getNewStatus());
        assertEquals("Reassigned from Agent Alpha to Agent Beta", h.getNote());
        assertEquals(admin.getId(), h.getChangedBy().getId());

        // Verify 2 notifications created
        verify(notificationService).createNotification(
                eq(agentA),
                eq(NotificationType.REASSIGNED_FROM_YOU),
                eq("Complaint reassigned"),
                contains("moved from you to Agent Beta by Admin Root"),
                eq(12L),
                eq("RIT-00012")
        );

        verify(notificationService).createNotification(
                eq(agentB),
                eq(NotificationType.ASSIGNED_TO_YOU),
                eq("New complaint assigned to you"),
                contains("was assigned to you by Admin Root. It was handled by Agent Alpha before."),
                eq(12L),
                eq("RIT-00012")
        );
    }

    @Test
    void adminFirstAssignmentCreatesOneNotificationAndNoHistory() {
        Complaint complaint = new Complaint("Login Glitch", "Cannot login after password reset",
                ComplaintCategory.ACCOUNT, ComplaintPriority.MEDIUM, user1);
        complaint.setId(5L);
        complaint.setAssignedTo(null);

        when(complaintRepository.findById(5L)).thenReturn(Optional.of(complaint));
        when(userRepository.findById(35L)).thenReturn(Optional.of(agentB));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignRequest req = new AssignRequest(agentB.getId());
        ComplaintResponse res = complaintService.assignComplaint(5L, req, admin);

        assertEquals(agentB.getId(), res.assignedTo().id());
        verify(historyRepository, never()).save(any(StatusHistory.class));

        verify(notificationService).createNotification(
                eq(agentB),
                eq(NotificationType.ASSIGNED_TO_YOU),
                eq("New complaint assigned to you"),
                contains("was assigned to you by Admin Root."),
                eq(5L),
                eq("RIT-00005")
        );
    }

    @Test
    void adminUnassignOnInProgressSetsStatusBackToOpen() {
        Complaint complaint = new Complaint("Printer jam", "Printer 3 jammed",
                ComplaintCategory.OTHER, ComplaintPriority.LOW, user1);
        complaint.setId(7L);
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaint.setAssignedTo(agentA);

        when(complaintRepository.findById(7L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignRequest req = new AssignRequest(null);
        ComplaintResponse res = complaintService.assignComplaint(7L, req, admin);

        assertNull(res.assignedTo());
        assertEquals(ComplaintStatus.OPEN, res.status());

        ArgumentCaptor<StatusHistory> histCaptor = ArgumentCaptor.forClass(StatusHistory.class);
        verify(historyRepository).save(histCaptor.capture());
        StatusHistory h = histCaptor.getValue();
        assertEquals(ComplaintStatus.IN_PROGRESS, h.getOldStatus());
        assertEquals(ComplaintStatus.OPEN, h.getNewStatus());
        assertEquals("Unassigned (was Agent Alpha); status set back to Open", h.getNote());

        verify(notificationService).createNotification(
                eq(agentA),
                eq(NotificationType.UNASSIGNED_FROM_YOU),
                eq("Complaint unassigned"),
                contains("was unassigned from you by Admin Root. It is no longer assigned to you. Status set back to Open."),
                eq(7L),
                eq("RIT-00007")
        );
    }

    @Test
    void agentSelfAssignCreatesZeroNotifications() {
        Complaint complaint = new Complaint("Issue", "Valid description for complaint",
                ComplaintCategory.OTHER, ComplaintPriority.LOW, user1);
        complaint.setId(8L);
        complaint.setAssignedTo(null);

        when(complaintRepository.findById(8L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignRequest req = new AssignRequest(agentA.getId());
        complaintService.assignComplaint(8L, req, agentA);

        verifyNoInteractions(notificationService);
    }

    @Test
    void adminAsAssigneeDoesNotReceiveSelfNotification() {
        Complaint complaint = new Complaint("Server reboot", "Scheduled reboot note",
                ComplaintCategory.TECHNICAL, ComplaintPriority.HIGH, user1);
        complaint.setId(9L);
        complaint.setAssignedTo(null);

        when(complaintRepository.findById(9L)).thenReturn(Optional.of(complaint));
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignRequest req = new AssignRequest(admin.getId());
        complaintService.assignComplaint(9L, req, admin);

        verifyNoInteractions(notificationService);
    }

    @Test
    void sameAgentReassignThrowsBadRequestAndNoNotification() {
        Complaint complaint = new Complaint("Network Down", "Switch issue",
                ComplaintCategory.TECHNICAL, ComplaintPriority.HIGH, user1);
        complaint.setId(12L);
        complaint.setAssignedTo(agentA);

        when(complaintRepository.findById(12L)).thenReturn(Optional.of(complaint));

        AssignRequest req = new AssignRequest(agentA.getId());
        ApiException ex = assertThrows(ApiException.class, () -> complaintService.assignComplaint(12L, req, admin));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("This complaint is already assigned to that agent", ex.getMessage());

        verifyNoInteractions(notificationService);
    }

    @Test
    void assignToUserOrInactiveTargetThrowsBadRequest() {
        Complaint complaint = new Complaint("Issue", "Valid description text",
                ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, user1);
        complaint.setId(1L);

        when(complaintRepository.findById(1L)).thenReturn(Optional.of(complaint));
        when(userRepository.findById(user2.getId())).thenReturn(Optional.of(user2));

        AssignRequest req = new AssignRequest(user2.getId());
        ApiException ex = assertThrows(ApiException.class, () -> complaintService.assignComplaint(1L, req, admin));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Assignee must be an active agent or admin", ex.getMessage());
    }

    @Test
    void permissionsFlagsForAdminAndAgent() {
        Complaint complaint = new Complaint("Issue", "Valid description text",
                ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, user1);
        complaint.setId(1L);
        complaint.setStatus(ComplaintStatus.OPEN);
        complaint.setAssignedTo(agentA);

        // Admin: canAssign is true even when already assigned
        ComplaintPermissions adminPerms = complaintService.buildPermissions(complaint, admin);
        assertTrue(adminPerms.canAssign());
        assertTrue(adminPerms.canEdit());
        assertTrue(adminPerms.canDelete());

        // Agent A (assignee): canAssign is false (already assigned)
        ComplaintPermissions agentAPerms = complaintService.buildPermissions(complaint, agentA);
        assertFalse(agentAPerms.canAssign());
        assertTrue(agentAPerms.allowedNextStatuses().contains(ComplaintStatus.IN_PROGRESS));

        // Agent B (not assignee): allowedNextStatuses is empty
        ComplaintPermissions agentBPerms = complaintService.buildPermissions(complaint, agentB);
        assertFalse(agentBPerms.canAssign());
        assertTrue(agentBPerms.allowedNextStatuses().isEmpty());
    }

    @Test
    void deleteComplaintRemovesCommentsAndHistoryFirst() {
        Complaint complaint = new Complaint("Title", "Valid description text",
                ComplaintCategory.TECHNICAL, ComplaintPriority.LOW, user1);
        complaint.setId(5L);

        when(complaintRepository.findById(5L)).thenReturn(Optional.of(complaint));

        complaintService.deleteComplaint(5L, user1);

        verify(commentRepository).deleteByComplaintId(5L);
        verify(historyRepository).deleteByComplaintId(5L);
        verify(complaintRepository).delete(complaint);
    }
}
