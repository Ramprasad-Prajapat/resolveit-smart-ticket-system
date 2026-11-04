package com.resolveit.repository;

import com.resolveit.model.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Data repository for complaint status history audit entries.
 */
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {

    List<StatusHistory> findByComplaintIdOrderByChangedAtAsc(Long complaintId);

    void deleteByComplaintId(Long complaintId);
}
