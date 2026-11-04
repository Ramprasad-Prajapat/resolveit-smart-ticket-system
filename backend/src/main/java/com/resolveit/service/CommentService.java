package com.resolveit.service;

import com.resolveit.dto.CommentRequest;
import com.resolveit.dto.CommentResponse;
import com.resolveit.dto.UserSummary;
import com.resolveit.exception.ApiException;
import com.resolveit.model.Comment;
import com.resolveit.model.Complaint;
import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.CommentRepository;
import com.resolveit.repository.ComplaintRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Handles posting and retrieving comments for complaints.
 */
@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final ComplaintRepository complaintRepository;

    public CommentService(CommentRepository commentRepository, ComplaintRepository complaintRepository) {
        this.commentRepository = commentRepository;
        this.complaintRepository = complaintRepository;
    }

    public List<CommentResponse> getComments(Long complaintId, User currentUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        verifyAccess(complaint, currentUser);

        return commentRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId)
                .stream()
                .map(this::toCommentResponse)
                .toList();
    }

    @Transactional
    public CommentResponse addComment(Long complaintId, CommentRequest req, User currentUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        verifyAccess(complaint, currentUser);

        Comment comment = new Comment(complaint, currentUser, req.message().trim());
        comment = commentRepository.save(comment);

        return toCommentResponse(comment);
    }

    private void verifyAccess(Complaint complaint, User currentUser) {
        if (currentUser.getRole() == Role.USER && !complaint.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to this complaint");
        }
    }

    private CommentResponse toCommentResponse(Comment comment) {
        User author = comment.getAuthor();
        UserSummary authorSummary = new UserSummary(author.getId(), author.getFullName(), author.getEmail());
        return new CommentResponse(
                comment.getId(),
                comment.getComplaint().getId(),
                authorSummary,
                comment.getMessage(),
                comment.getCreatedAt()
        );
    }
}
