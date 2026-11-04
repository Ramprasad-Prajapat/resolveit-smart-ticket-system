package com.resolveit.repository;

import com.resolveit.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Data repository for complaint comments.
 */
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);

    void deleteByComplaintId(Long complaintId);
}
