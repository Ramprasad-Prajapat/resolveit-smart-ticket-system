package com.resolveit.service;

import com.resolveit.dto.UserResponse;
import com.resolveit.exception.ApiException;
import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.UserRepository;
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
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    private UserService userService;

    private User admin;
    private User normalUser;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, authService);

        admin = new User();
        admin.setId(1L);
        admin.setEmail("admin@test.com");
        admin.setFullName("Admin User");
        admin.setRole(Role.ADMIN);
        admin.setActive(true);

        normalUser = new User();
        normalUser.setId(2L);
        normalUser.setEmail("user@test.com");
        normalUser.setFullName("Normal User");
        normalUser.setRole(Role.USER);
        normalUser.setActive(true);
    }

    @Test
    void getAllUsers_returnsMappedList() {
        when(userRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(admin, normalUser));
        when(authService.toUserResponse(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt());
        });

        List<UserResponse> list = userService.getAllUsers();
        assertEquals(2, list.size());
        verify(userRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void getAssignableUsers_returnsActiveStaff() {
        when(userRepository.findByRoleInAndActiveTrue(anyList())).thenReturn(List.of(admin));
        when(authService.toUserResponse(admin)).thenReturn(
                new UserResponse(admin.getId(), admin.getFullName(), admin.getEmail(), admin.getRole(), admin.isActive(), admin.getCreatedAt())
        );

        List<UserResponse> list = userService.getAssignableUsers();
        assertEquals(1, list.size());
        assertEquals("admin@test.com", list.get(0).email());
    }

    @Test
    void updateRole_success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));
        when(userRepository.save(normalUser)).thenReturn(normalUser);
        when(authService.toUserResponse(normalUser)).thenReturn(
                new UserResponse(normalUser.getId(), normalUser.getFullName(), normalUser.getEmail(), Role.AGENT, true, normalUser.getCreatedAt())
        );

        UserResponse res = userService.updateRole(2L, Role.AGENT, admin);
        assertEquals(Role.AGENT, res.role());
        verify(userRepository).save(normalUser);
    }

    @Test
    void updateRole_selfModification_throwsBadRequest() {
        ApiException ex = assertThrows(ApiException.class, () -> userService.updateRole(1L, Role.AGENT, admin));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Cannot change your own role"));
    }

    @Test
    void updateRole_userNotFound_throwsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> userService.updateRole(99L, Role.AGENT, admin));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void updateActive_success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));
        when(userRepository.save(normalUser)).thenReturn(normalUser);
        when(authService.toUserResponse(normalUser)).thenReturn(
                new UserResponse(normalUser.getId(), normalUser.getFullName(), normalUser.getEmail(), normalUser.getRole(), false, normalUser.getCreatedAt())
        );

        UserResponse res = userService.updateActive(2L, false, admin);
        assertFalse(res.active());
        verify(userRepository).save(normalUser);
    }

    @Test
    void updateActive_selfDeactivation_throwsBadRequest() {
        ApiException ex = assertThrows(ApiException.class, () -> userService.updateActive(1L, false, admin));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Cannot deactivate your own account"));
    }

    @Test
    void updateActive_userNotFound_throwsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> userService.updateActive(99L, false, admin));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }
}
