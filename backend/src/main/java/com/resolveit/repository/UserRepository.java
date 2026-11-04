package com.resolveit.repository;

import com.resolveit.model.Role;
import com.resolveit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Data repository for user accounts.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    List<User> findByRoleInAndActiveTrue(List<Role> roles);

    List<User> findAllByOrderByCreatedAtDesc();
}
