package com.resolveit.service;

import com.resolveit.dto.AuthResponse;
import com.resolveit.dto.LoginRequest;
import com.resolveit.dto.RegisterRequest;
import com.resolveit.exception.ApiException;
import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.UserRepository;
import com.resolveit.security.JwtUtil;
import com.resolveit.security.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private LoginAttemptService loginAttemptService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil, loginAttemptService);
    }

    @Test
    void registerSuccess() {
        RegisterRequest req = new RegisterRequest("Alice Smith", "alice@test.com", "Password123");
        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("hashed123");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtUtil.generateToken(any(User.class))).thenReturn("jwt-token-xyz");

        AuthResponse res = authService.register(req);
        assertNotNull(res);
        assertEquals("jwt-token-xyz", res.token());
        assertEquals("Alice Smith", res.user().fullName());
        assertEquals(Role.USER, res.user().role());
    }

    @Test
    void registerDuplicateEmailThrowsConflict() {
        RegisterRequest req = new RegisterRequest("Alice Smith", "alice@test.com", "Password123");
        when(userRepository.existsByEmail("alice@test.com")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void loginSuccess() {
        LoginRequest req = new LoginRequest("alice@test.com", "Password123");
        User user = new User("Alice Smith", "alice@test.com", "hashed123", Role.USER);
        user.setId(1L);

        when(loginAttemptService.isLocked("alice@test.com")).thenReturn(false);
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "hashed123")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("valid-jwt");

        AuthResponse res = authService.login(req);
        assertEquals("valid-jwt", res.token());
        verify(loginAttemptService).recordSuccess("alice@test.com");
    }

    @Test
    void loginInvalidPasswordThrowsUnauthorized() {
        LoginRequest req = new LoginRequest("alice@test.com", "WrongPassword");
        User user = new User("Alice Smith", "alice@test.com", "hashed123", Role.USER);

        when(loginAttemptService.isLocked("alice@test.com")).thenReturn(false);
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "hashed123")).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(req));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verify(loginAttemptService).recordFailure("alice@test.com");
    }

    @Test
    void loginLockedThrowsTooManyRequests() {
        LoginRequest req = new LoginRequest("locked@test.com", "Password123");
        when(loginAttemptService.isLocked("locked@test.com")).thenReturn(true);
        when(loginAttemptService.getRemainingLockMinutes("locked@test.com")).thenReturn(12L);

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(req));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertTrue(ex.getMessage().contains("12 minute(s)"));
    }

    @Test
    void loginDeactivatedThrowsForbidden() {
        LoginRequest req = new LoginRequest("inactive@test.com", "Password123");
        User user = new User("Inactive", "inactive@test.com", "hash", Role.USER);
        user.setActive(false);

        when(loginAttemptService.isLocked("inactive@test.com")).thenReturn(false);
        when(userRepository.findByEmail("inactive@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "hash")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(req));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void loginUnknownUserThrowsUnauthorizedSameMessage() {
        LoginRequest req = new LoginRequest("unknown@test.com", "Password123");
        when(loginAttemptService.isLocked("unknown@test.com")).thenReturn(false);
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(req));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals("Invalid email or password", ex.getMessage());
        verify(loginAttemptService).recordFailure("unknown@test.com");
    }

    @Test
    void getCurrentUser_returnsResponse() {
        User user = new User("Alice", "alice@test.com", "hash", Role.USER);
        user.setId(5L);
        var resp = authService.getCurrentUser(user);
        assertEquals(5L, resp.id());
        assertEquals("Alice", resp.fullName());
    }

    @Test
    void updateProfile_success() {
        User user = new User("Alice", "alice@test.com", "hash", Role.USER);
        user.setId(5L);
        when(userRepository.save(user)).thenReturn(user);

        var resp = authService.updateProfile(user, new com.resolveit.dto.UpdateProfileRequest("Alice Updated"));
        assertEquals("Alice Updated", resp.fullName());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_wrongCurrentThrowsBadRequest() {
        User user = new User("Alice", "alice@test.com", "hash", Role.USER);
        when(passwordEncoder.matches("OldWrong", "hash")).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () ->
                authService.changePassword(user, new com.resolveit.dto.ChangePasswordRequest("OldWrong", "NewPass123")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Current password does not match"));
    }

    @Test
    void changePassword_weakNewPasswordThrowsBadRequest() {
        User user = new User("Alice", "alice@test.com", "hash", Role.USER);
        when(passwordEncoder.matches("OldRight", "hash")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () ->
                authService.changePassword(user, new com.resolveit.dto.ChangePasswordRequest("OldRight", "weak")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Password must be 8 to 64 characters"));
    }

    @Test
    void changePassword_success() {
        User user = new User("Alice", "alice@test.com", "hash", Role.USER);
        when(passwordEncoder.matches("OldRight", "hash")).thenReturn(true);
        when(passwordEncoder.encode("ValidNewPass123")).thenReturn("newHash");

        authService.changePassword(user, new com.resolveit.dto.ChangePasswordRequest("OldRight", "ValidNewPass123"));
        assertEquals("newHash", user.getPasswordHash());
        verify(userRepository).save(user);
    }
}
