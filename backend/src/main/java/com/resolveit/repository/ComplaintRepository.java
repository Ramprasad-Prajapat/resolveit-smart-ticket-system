package com.resolveit.repository;

import com.resolveit.model.Complaint;
import com.resolveit.model.ComplaintCategory;
import com.resolveit.model.ComplaintPriority;
import com.resolveit.model.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Data repository for complaints, including paged search queries and status counters.
 */
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    @Query("""
        SELECT c FROM Complaint c
        WHERE c.status IN :statuses
          AND c.category IN :categories
          AND c.priority IN :priorities
          AND (:onlyOwn = false OR c.createdBy.id = :ownerId)
          AND (:onlyAssignedToMe = false OR (c.assignedTo IS NOT NULL AND c.assignedTo.id = :assigneeId))
          AND (:onlyUnassigned = false OR c.assignedTo IS NULL)
          AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR c.id = :searchId)
        """)
    Page<Complaint> findFiltered(
        @Param("statuses") List<ComplaintStatus> statuses,
        @Param("categories") List<ComplaintCategory> categories,
        @Param("priorities") List<ComplaintPriority> priorities,
        @Param("onlyOwn") boolean onlyOwn,
        @Param("ownerId") Long ownerId,
        @Param("onlyAssignedToMe") boolean onlyAssignedToMe,
        @Param("assigneeId") Long assigneeId,
        @Param("onlyUnassigned") boolean onlyUnassigned,
        @Param("search") String search,
        @Param("searchId") Long searchId,
        Pageable pageable
    );

    long countByStatus(ComplaintStatus status);

    long countByAssignedToIsNullAndStatusNot(ComplaintStatus status);

    long countByAssignedToIdAndStatusNot(Long assigneeId, ComplaintStatus status);

    long countByCreatedById(Long userId);

    long countByCreatedByIdAndStatus(Long userId, ComplaintStatus status);
}
