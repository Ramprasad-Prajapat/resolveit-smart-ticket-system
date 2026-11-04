package com.resolveit.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceTest {

    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService();
        ReflectionTestUtils.setField(loginAttemptService, "maxAttempts", 3);
        ReflectionTestUtils.setField(loginAttemptService, "windowMinutes", 15L);
        ReflectionTestUtils.setField(loginAttemptService, "lockMinutes", 15L);
    }

    @Test
    void testLockAfterMaxAttempts() {
        String email = "target@example.com";
        assertFalse(loginAttemptService.isLocked(email));

        loginAttemptService.recordFailure(email);
        assertFalse(loginAttemptService.isLocked(email));

        loginAttemptService.recordFailure(email);
        assertFalse(loginAttemptService.isLocked(email));

        loginAttemptService.recordFailure(email);
        assertTrue(loginAttemptService.isLocked(email));
        assertTrue(loginAttemptService.getRemainingLockMinutes(email) > 0);
    }

    @Test
    void testSuccessResetsFailureCount() {
        String email = "clean@example.com";
        loginAttemptService.recordFailure(email);
        loginAttemptService.recordFailure(email);
        assertFalse(loginAttemptService.isLocked(email));

        loginAttemptService.recordSuccess(email);
        assertFalse(loginAttemptService.isLocked(email));

        // Now two more failures should not lock it because count was reset
        loginAttemptService.recordFailure(email);
        loginAttemptService.recordFailure(email);
        assertFalse(loginAttemptService.isLocked(email));
    }
}
