package com.resolveit.controller;

import com.resolveit.dto.*;
import com.resolveit.model.User;
import com.resolveit.service.CommentService;
import com.resolveit.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing endpoints for complaints, status changes, comments, and audit history.
 */
@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final CommentService commentService;

    public ComplaintController(ComplaintService complaintService, CommentService commentService) {
        this.complaintService = complaintService;
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ComplaintResponse>> listComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Boolean assignedToMe,
            @RequestParam(required = false) Boolean unassigned,
            @AuthenticationPrincipal User user) {

        PageResponse<ComplaintResponse> response = complaintService.listComplaints(
                page, size, sort, search, status, category, priority, assignedToMe, unassigned, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<ComplaintSummaryResponse> getSummary(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.getSummary(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.getById(id, user));
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @Valid @RequestBody ComplaintRequest req,
            @AuthenticationPrincipal User user) {
        ComplaintResponse created = complaintService.create(req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComplaintResponse> updateComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.updateComplaint(id, req, user));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.updateStatus(id, req, user));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assign(
            @PathVariable Long id,
            @RequestBody AssignRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.assignComplaint(id, req, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        complaintService.deleteComplaint(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(commentService.getComments(id, user));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest req,
            @AuthenticationPrincipal User user) {
        CommentResponse response = commentService.addComment(id, req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<StatusHistoryResponse>> getHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.getHistory(id, user));
    }
}
