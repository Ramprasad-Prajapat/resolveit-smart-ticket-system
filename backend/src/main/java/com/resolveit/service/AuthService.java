package com.resolveit.service;

import com.resolveit.dto.*;
import com.resolveit.exception.ApiException;
import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.UserRepository;
import com.resolveit.security.JwtUtil;
import com.resolveit.security.LoginAttemptService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles user registration, authentication, token issuance, and profile changes.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.loginAttemptService = loginAttemptService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }

        validatePasswordFormat(req.password());

        String hash = passwordEncoder.encode(req.password());
        User user = new User(req.fullName().trim(), email, hash, Role.USER);
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, toUserResponse(user));
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();

        if (loginAttemptService.isLocked(email)) {
            long remaining = loginAttemptService.getRemainingLockMinutes(email);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed login attempts. Try again in " + remaining + " minute(s).");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            loginAttemptService.recordFailure(email);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is deactivated");
        }

        loginAttemptService.recordSuccess(email);
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, toUserResponse(user));
    }

    public UserResponse getCurrentUser(User user) {
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(User user, UpdateProfileRequest req) {
        user.setFullName(req.fullName().trim());
        user = userRepository.save(user);
        return toUserResponse(user);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest req) {
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password does not match");
        }

        validatePasswordFormat(req.newPassword());

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    private void validatePasswordFormat(String password) {
        if (password == null || !password.matches("^(?=.*[a-zA-Z])(?=.*\\d).{8,64}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Password must be 8 to 64 characters and contain at least one letter and one number");
        }
    }

    public UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
