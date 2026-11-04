package com.resolveit.service;

import com.resolveit.dto.CommentRequest;
import com.resolveit.dto.CommentResponse;
import com.resolveit.exception.ApiException;
import com.resolveit.model.*;
import com.resolveit.repository.CommentRepository;
import com.resolveit.repository.ComplaintRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private ComplaintRepository complaintRepository;

    private CommentService commentService;

    private User owner;
    private User otherUser;
    private Complaint complaint;

    @BeforeEach
    void setUp() {
        commentService = new CommentService(commentRepository, complaintRepository);

        owner = new User("Owner", "owner@test.com", "hash", Role.USER);
        owner.setId(1L);

        otherUser = new User("Other", "other@test.com", "hash", Role.USER);
        otherUser.setId(2L);

        complaint = new Complaint("Title", "Description long enough",
                ComplaintCategory.TECHNICAL, ComplaintPriority.MEDIUM, owner);
        complaint.setId(10L);
    }

    @Test
    void addCommentSuccessForOwner() {
        when(complaintRepository.findById(10L)).thenReturn(Optional.of(complaint));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });

        CommentRequest req = new CommentRequest("This is a helpful comment");
        CommentResponse res = commentService.addComment(10L, req, owner);

        assertNotNull(res);
        assertEquals("This is a helpful comment", res.message());
        assertEquals(owner.getId(), res.author().id());
    }

    @Test
    void addCommentForbiddenForOtherUser() {
        when(complaintRepository.findById(10L)).thenReturn(Optional.of(complaint));
        CommentRequest req = new CommentRequest("Trying to comment");

        ApiException ex = assertThrows(ApiException.class, () -> commentService.addComment(10L, req, otherUser));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void getCommentsReturnsListForOwner() {
        when(complaintRepository.findById(10L)).thenReturn(Optional.of(complaint));
        Comment c = new Comment(complaint, owner, "Existing comment");
        c.setId(1L);
        when(commentRepository.findByComplaintIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(c));

        List<CommentResponse> list = commentService.getComments(10L, owner);
        assertEquals(1, list.size());
        assertEquals("Existing comment", list.get(0).message());
    }
}
