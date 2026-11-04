package com.resolveit.service;

import com.resolveit.dto.UserResponse;
import com.resolveit.exception.ApiException;
import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Handles administrator operations on user accounts.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuthService authService;

    public UserService(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(authService::toUserResponse)
                .toList();
    }

    public List<UserResponse> getAssignableUsers() {
        return userRepository.findByRoleInAndActiveTrue(List.of(Role.AGENT, Role.ADMIN))
                .stream()
                .map(authService::toUserResponse)
                .toList();
    }

    @Transactional
    public UserResponse updateRole(Long targetUserId, Role newRole, User currentAdmin) {
        if (targetUserId.equals(currentAdmin.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot change your own role");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        target.setRole(newRole);
        target = userRepository.save(target);
        return authService.toUserResponse(target);
    }

    @Transactional
    public UserResponse updateActive(Long targetUserId, boolean active, User currentAdmin) {
        if (targetUserId.equals(currentAdmin.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot deactivate your own account");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        target.setActive(active);
        target = userRepository.save(target);
        return authService.toUserResponse(target);
    }
}
