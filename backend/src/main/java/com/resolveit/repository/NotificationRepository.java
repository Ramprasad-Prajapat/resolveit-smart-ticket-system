package com.resolveit.repository;

import com.resolveit.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data repository for user alert notifications.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop5ByUserIdAndIsReadFalseOrderByCreatedAtAsc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);
}
