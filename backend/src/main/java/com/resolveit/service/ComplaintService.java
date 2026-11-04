package com.resolveit.service;

import com.resolveit.dto.*;
import com.resolveit.exception.ApiException;
import com.resolveit.model.*;
import com.resolveit.repository.CommentRepository;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.StatusHistoryRepository;
import com.resolveit.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Handles core business operations for complaints: CRUD, assignment, status workflow, and search.
 */
@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CommentRepository commentRepository;
    private final StatusHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ComplaintService(ComplaintRepository complaintRepository,
                            CommentRepository commentRepository,
                            StatusHistoryRepository historyRepository,
                            UserRepository userRepository,
                            NotificationService notificationService) {
        this.complaintRepository = complaintRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ComplaintResponse create(ComplaintRequest req, User currentUser) {
        Complaint complaint = new Complaint(
                req.title().trim(),
                req.description().trim(),
                req.category(),
                req.priority(),
                currentUser
        );
        complaint = complaintRepository.save(complaint);

        StatusHistory initialHistory = new StatusHistory(
                complaint,
                null,
                ComplaintStatus.OPEN,
                currentUser,
                "Complaint created"
        );
        historyRepository.save(initialHistory);

        return toComplaintResponse(complaint, currentUser);
    }

    public ComplaintResponse getById(Long id, User currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (currentUser.getRole() == Role.USER && !complaint.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this complaint");
        }

        return toComplaintResponse(complaint, currentUser);
    }

    public PageResponse<ComplaintResponse> listComplaints(
            int page,
            int size,
            String sortParam,
            String search,
            String statusParam,
            String categoryParam,
            String priorityParam,
            Boolean assignedToMe,
            Boolean unassigned,
            User currentUser) {

        int cleanPage = Math.max(0, page);
        int cleanSize = Math.min(Math.max(1, size), 50);

        Sort sort = parseSort(sortParam);
        Pageable pageable = PageRequest.of(cleanPage, cleanSize, sort);

        List<ComplaintStatus> statuses = parseStatuses(statusParam);
        List<ComplaintCategory> categories = parseCategories(categoryParam);
        List<ComplaintPriority> priorities = parsePriorities(priorityParam);

        boolean onlyOwn = (currentUser.getRole() == Role.USER);
        Long ownerId = onlyOwn ? currentUser.getId() : -1L;

        boolean onlyAssignedToMe = (!onlyOwn && assignedToMe != null && assignedToMe);
        Long assigneeId = onlyAssignedToMe ? currentUser.getId() : -1L;

        boolean onlyUnassigned = (!onlyOwn && unassigned != null && unassigned);

        String searchStr = (search != null) ? search.trim() : "";
        Long searchId = parseSearchId(searchStr);

        Page<Complaint> pageResult = complaintRepository.findFiltered(
                statuses,
                categories,
                priorities,
                onlyOwn,
                ownerId,
                onlyAssignedToMe,
                assigneeId,
                onlyUnassigned,
                searchStr,
                searchId,
                pageable
        );

        List<ComplaintResponse> content = pageResult.getContent()
                .stream()
                .map(c -> toComplaintResponse(c, currentUser))
                .toList();

        return new PageResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isFirst(),
                pageResult.isLast()
        );
    }

    public ComplaintSummaryResponse getSummary(User currentUser) {
        if (currentUser.getRole() == Role.USER) {
            long total = complaintRepository.countByCreatedById(currentUser.getId());
            long open = complaintRepository.countByCreatedByIdAndStatus(currentUser.getId(), ComplaintStatus.OPEN);
            long inProgress = complaintRepository.countByCreatedByIdAndStatus(currentUser.getId(), ComplaintStatus.IN_PROGRESS);
            long resolved = complaintRepository.countByCreatedByIdAndStatus(currentUser.getId(), ComplaintStatus.RESOLVED);
            return new ComplaintSummaryResponse(total, open, inProgress, resolved, 0, 0);
        } else {
            long total = complaintRepository.count();
            long open = complaintRepository.countByStatus(ComplaintStatus.OPEN);
            long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
            long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
            long unassigned = complaintRepository.countByAssignedToIsNullAndStatusNot(ComplaintStatus.RESOLVED);
            long assignedToMe = complaintRepository.countByAssignedToIdAndStatusNot(currentUser.getId(), ComplaintStatus.RESOLVED);
            return new ComplaintSummaryResponse(total, open, inProgress, resolved, unassigned, assignedToMe);
        }
    }

    @Transactional
    public ComplaintResponse updateComplaint(Long id, ComplaintRequest req, User currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (currentUser.getRole() == Role.AGENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Agents cannot edit complaint details");
        }

        if (currentUser.getRole() == Role.USER) {
            if (!complaint.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this complaint");
            }
            if (complaint.getStatus() != ComplaintStatus.OPEN) {
                throw new ApiException(HttpStatus.CONFLICT, "Cannot edit complaint after work has started");
            }
        }

        complaint.setTitle(req.title().trim());
        complaint.setDescription(req.description().trim());
        complaint.setCategory(req.category());
        complaint.setPriority(req.priority());
        complaint.setUpdatedAt(LocalDateTime.now());

        complaint = complaintRepository.save(complaint);
        return toComplaintResponse(complaint, currentUser);
    }

    @Transactional
    public ComplaintResponse updateStatus(Long id, StatusUpdateRequest req, User currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        ComplaintStatus current = complaint.getStatus();
        ComplaintStatus target = req.status();

        if (current == target) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Complaint is already in status " + target);
        }

        // Validate who can perform this transition
        if (currentUser.getRole() == Role.USER) {
            if (!complaint.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this complaint");
            }
            if (current != ComplaintStatus.RESOLVED || target != ComplaintStatus.OPEN) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Users can only reopen resolved complaints");
            }
        } else if (currentUser.getRole() == Role.AGENT) {
            if (complaint.getAssignedTo() == null || !complaint.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "This complaint is not assigned to you");
            }
        }

        // Validate allowed transitions:
        // OPEN -> IN_PROGRESS
        // IN_PROGRESS -> OPEN or RESOLVED
        // RESOLVED -> OPEN
        boolean validTransition = switch (current) {
            case OPEN -> (target == ComplaintStatus.IN_PROGRESS);
            case IN_PROGRESS -> (target == ComplaintStatus.OPEN || target == ComplaintStatus.RESOLVED);
            case RESOLVED -> (target == ComplaintStatus.OPEN);
        };

        if (!validTransition) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status transition from " + current + " to " + target);
        }

        if (target == ComplaintStatus.IN_PROGRESS && complaint.getAssignedTo() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Complaint must be assigned before moving to IN_PROGRESS");
        }

        complaint.setStatus(target);
        complaint.setUpdatedAt(LocalDateTime.now());
        if (target == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        } else {
            complaint.setResolvedAt(null);
        }

        complaint = complaintRepository.save(complaint);

        String note = (req.note() != null && !req.note().isBlank()) ? req.note().trim() : null;
        StatusHistory history = new StatusHistory(complaint, current, target, currentUser, note);
        historyRepository.save(history);

        return toComplaintResponse(complaint, currentUser);
    }

    @Transactional
    public ComplaintResponse assignComplaint(Long id, AssignRequest req, User currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (currentUser.getRole() == Role.USER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Users cannot assign complaints");
        }

        User oldAssignee = complaint.getAssignedTo();
        String ticketNumber = "RIT-" + String.format("%05d", complaint.getId());
        String truncatedTitle = NotificationService.truncateTitle(complaint.getTitle());

        if (currentUser.getRole() == Role.AGENT) {
            if (req.assigneeId() == null || !req.assigneeId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Agents can only self-assign unassigned complaints");
            }
            if (oldAssignee != null) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Complaint is already assigned");
            }
            complaint.setAssignedTo(currentUser);
        } else if (currentUser.getRole() == Role.ADMIN) {
            if (req.assigneeId() == null) {
                if (oldAssignee == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Complaint is not assigned");
                }
                complaint.setAssignedTo(null);

                if (complaint.getStatus() == ComplaintStatus.IN_PROGRESS) {
                    complaint.setStatus(ComplaintStatus.OPEN);
                    StatusHistory history = new StatusHistory(
                            complaint,
                            ComplaintStatus.IN_PROGRESS,
                            ComplaintStatus.OPEN,
                            currentUser,
                            "Unassigned (was " + oldAssignee.getFullName() + "); status set back to Open"
                    );
                    historyRepository.save(history);

                    if (!oldAssignee.getId().equals(currentUser.getId())) {
                        String msg = "Ticket " + ticketNumber + " \"" + truncatedTitle + "\" was unassigned from you by " +
                                currentUser.getFullName() + ". It is no longer assigned to you. Status set back to Open.";
                        notificationService.createNotification(
                                oldAssignee,
                                NotificationType.UNASSIGNED_FROM_YOU,
                                "Complaint unassigned",
                                msg,
                                complaint.getId(),
                                ticketNumber
                        );
                    }
                } else {
                    StatusHistory history = new StatusHistory(
                            complaint,
                            complaint.getStatus(),
                            complaint.getStatus(),
                            currentUser,
                            "Unassigned (was " + oldAssignee.getFullName() + ")"
                    );
                    historyRepository.save(history);

                    if (!oldAssignee.getId().equals(currentUser.getId())) {
                        String msg = "Ticket " + ticketNumber + " \"" + truncatedTitle + "\" was unassigned from you by " +
                                currentUser.getFullName() + ". It is no longer assigned to you.";
                        notificationService.createNotification(
                                oldAssignee,
                                NotificationType.UNASSIGNED_FROM_YOU,
                                "Complaint unassigned",
                                msg,
                                complaint.getId(),
                                ticketNumber
                        );
                    }
                }
            } else {
                if (oldAssignee != null && oldAssignee.getId().equals(req.assigneeId())) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "This complaint is already assigned to that agent");
                }

                User newAssignee = userRepository.findById(req.assigneeId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignee user not found"));
                if (!newAssignee.isActive() || newAssignee.getRole() == Role.USER) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Assignee must be an active agent or admin");
                }

                complaint.setAssignedTo(newAssignee);
                String friendlyStatus = toFriendlyStatus(complaint.getStatus());
                String friendlyPriority = toFriendlyPriority(complaint.getPriority());

                if (oldAssignee != null) {
                    StatusHistory history = new StatusHistory(
                            complaint,
                            complaint.getStatus(),
                            complaint.getStatus(),
                            currentUser,
                            "Reassigned from " + oldAssignee.getFullName() + " to " + newAssignee.getFullName()
                    );
                    historyRepository.save(history);

                    if (!oldAssignee.getId().equals(currentUser.getId())) {
                        String msgA = "Ticket " + ticketNumber + " \"" + truncatedTitle + "\" was moved from you to " +
                                newAssignee.getFullName() + " by " + currentUser.getFullName() +
                                ". It is no longer assigned to you, so you cannot change its status. Current status: " +
                                friendlyStatus + ".";
                        notificationService.createNotification(
                                oldAssignee,
                                NotificationType.REASSIGNED_FROM_YOU,
                                "Complaint reassigned",
                                msgA,
                                complaint.getId(),
                                ticketNumber
                        );
                    }

                    if (!newAssignee.getId().equals(currentUser.getId())) {
                        String msgB = "Ticket " + ticketNumber + " \"" + truncatedTitle + "\" (priority " +
                                friendlyPriority + ", status " + friendlyStatus + ") was assigned to you by " +
                                currentUser.getFullName() + ". It was handled by " + oldAssignee.getFullName() + " before.";
                        notificationService.createNotification(
                                newAssignee,
                                NotificationType.ASSIGNED_TO_YOU,
                                "New complaint assigned to you",
                                msgB,
                                complaint.getId(),
                                ticketNumber
                        );
                    }
                } else {
                    if (!newAssignee.getId().equals(currentUser.getId())) {
                        String msgB = "Ticket " + ticketNumber + " \"" + truncatedTitle + "\" (priority " +
                                friendlyPriority + ", status " + friendlyStatus + ") was assigned to you by " +
                                currentUser.getFullName() + ".";
                        notificationService.createNotification(
                                newAssignee,
                                NotificationType.ASSIGNED_TO_YOU,
                                "New complaint assigned to you",
                                msgB,
                                complaint.getId(),
                                ticketNumber
                        );
                    }
                }
            }
        }

        complaint.setUpdatedAt(LocalDateTime.now());
        complaint = complaintRepository.save(complaint);
        return toComplaintResponse(complaint, currentUser);
    }

    @Transactional
    public void deleteComplaint(Long id, User currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (currentUser.getRole() == Role.AGENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Agents cannot delete complaints");
        }

        if (currentUser.getRole() == Role.USER) {
            if (!complaint.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this complaint");
            }
            if (complaint.getStatus() != ComplaintStatus.OPEN) {
                throw new ApiException(HttpStatus.CONFLICT, "Cannot delete complaint after work has started");
            }
        }

        commentRepository.deleteByComplaintId(id);
        historyRepository.deleteByComplaintId(id);
        complaintRepository.delete(complaint);
    }

    public List<StatusHistoryResponse> getHistory(Long complaintId, User currentUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (currentUser.getRole() == Role.USER && !complaint.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this complaint");
        }

        return historyRepository.findByComplaintIdOrderByChangedAtAsc(complaintId)
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    public ComplaintResponse toComplaintResponse(Complaint c, User currentUser) {
        String ticketNumber = "RIT-" + String.format("%05d", c.getId());

        User creator = c.getCreatedBy();
        UserSummary createdBySummary = new UserSummary(creator.getId(), creator.getFullName(), creator.getEmail());

        UserSummary assignedToSummary = null;
        if (c.getAssignedTo() != null) {
            User assignee = c.getAssignedTo();
            assignedToSummary = new UserSummary(assignee.getId(), assignee.getFullName(), assignee.getEmail());
        }

        ComplaintPermissions permissions = buildPermissions(c, currentUser);

        return new ComplaintResponse(
                c.getId(),
                ticketNumber,
                c.getTitle(),
                c.getDescription(),
                c.getCategory(),
                c.getPriority(),
                c.getStatus(),
                createdBySummary,
                assignedToSummary,
                c.getCreatedAt(),
                c.getUpdatedAt(),
                c.getResolvedAt(),
                permissions
        );
    }

    public ComplaintPermissions buildPermissions(Complaint c, User u) {
        boolean isOwner = c.getCreatedBy().getId().equals(u.getId());
        boolean isAssignee = (c.getAssignedTo() != null && c.getAssignedTo().getId().equals(u.getId()));
        Role role = u.getRole();

        boolean canEdit = false;
        boolean canDelete = false;
        boolean canAssign = false;
        List<ComplaintStatus> allowedNext = new ArrayList<>();

        if (role == Role.ADMIN) {
            canEdit = true;
            canDelete = true;
            canAssign = true;
            if (c.getStatus() == ComplaintStatus.OPEN) {
                allowedNext.add(ComplaintStatus.IN_PROGRESS);
            } else if (c.getStatus() == ComplaintStatus.IN_PROGRESS) {
                allowedNext.add(ComplaintStatus.OPEN);
                allowedNext.add(ComplaintStatus.RESOLVED);
            } else if (c.getStatus() == ComplaintStatus.RESOLVED) {
                allowedNext.add(ComplaintStatus.OPEN);
            }
        } else if (role == Role.AGENT) {
            canAssign = (c.getAssignedTo() == null);
            if (isAssignee) {
                if (c.getStatus() == ComplaintStatus.OPEN) {
                    allowedNext.add(ComplaintStatus.IN_PROGRESS);
                } else if (c.getStatus() == ComplaintStatus.IN_PROGRESS) {
                    allowedNext.add(ComplaintStatus.OPEN);
                    allowedNext.add(ComplaintStatus.RESOLVED);
                } else if (c.getStatus() == ComplaintStatus.RESOLVED) {
                    allowedNext.add(ComplaintStatus.OPEN);
                }
            }
        } else { // USER
            if (isOwner && c.getStatus() == ComplaintStatus.OPEN) {
                canEdit = true;
                canDelete = true;
            }
            if (isOwner && c.getStatus() == ComplaintStatus.RESOLVED) {
                allowedNext.add(ComplaintStatus.OPEN);
            }
        }

        return new ComplaintPermissions(canEdit, canDelete, canAssign, allowedNext);
    }

    private StatusHistoryResponse toHistoryResponse(StatusHistory h) {
        User changer = h.getChangedBy();
        UserSummary changedBy = new UserSummary(changer.getId(), changer.getFullName(), changer.getEmail());
        return new StatusHistoryResponse(
                h.getId(),
                h.getComplaint().getId(),
                h.getOldStatus(),
                h.getNewStatus(),
                changedBy,
                h.getNote(),
                h.getChangedAt()
        );
    }

    private Sort parseSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank() || sortParam.equals("createdAt,desc")) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        if (sortParam.equals("createdAt,asc")) {
            return Sort.by(Sort.Direction.ASC, "createdAt");
        }
        if (sortParam.equals("updatedAt,desc")) {
            return Sort.by(Sort.Direction.DESC, "updatedAt");
        }
        if (sortParam.equals("title,asc")) {
            return Sort.by(Sort.Direction.ASC, "title");
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid sort parameter: " + sortParam);
    }

    private List<ComplaintStatus> parseStatuses(String param) {
        if (param == null || param.isBlank()) {
            return Arrays.asList(ComplaintStatus.values());
        }
        try {
            return List.of(ComplaintStatus.valueOf(param.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status filter: " + param);
        }
    }

    private List<ComplaintCategory> parseCategories(String param) {
        if (param == null || param.isBlank()) {
            return Arrays.asList(ComplaintCategory.values());
        }
        try {
            return List.of(ComplaintCategory.valueOf(param.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid category filter: " + param);
        }
    }

    private List<ComplaintPriority> parsePriorities(String param) {
        if (param == null || param.isBlank()) {
            return Arrays.asList(ComplaintPriority.values());
        }
        try {
            return List.of(ComplaintPriority.valueOf(param.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid priority filter: " + param);
        }
    }

    private Long parseSearchId(String search) {
        if (search == null || search.isBlank()) {
            return -1L;
        }
        String clean = search.trim();
        if (clean.toUpperCase().startsWith("RIT-")) {
            try {
                return Long.parseLong(clean.substring(4));
            } catch (NumberFormatException e) {
                return -1L;
            }
        }
        try {
            return Long.parseLong(clean);
        } catch (NumberFormatException e) {
            return -1L;
        }
    }

    private String toFriendlyStatus(ComplaintStatus status) {
        if (status == null) return "";
        return switch (status) {
            case OPEN -> "Open";
            case IN_PROGRESS -> "In Progress";
            case RESOLVED -> "Resolved";
        };
    }

    private String toFriendlyPriority(ComplaintPriority priority) {
        if (priority == null) return "";
        return switch (priority) {
            case LOW -> "Low";
            case MEDIUM -> "Medium";
            case HIGH -> "High";
        };
    }
}
