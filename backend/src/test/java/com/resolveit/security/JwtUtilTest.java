package com.resolveit.security;

import com.resolveit.model.Role;
import com.resolveit.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "my-super-secret-jwt-key-with-at-least-32-chars-long");
        ReflectionTestUtils.setField(jwtUtil, "expirationMinutes", 60L);
        jwtUtil.init();
    }

    @Test
    void testTokenGenerationAndValidation() {
        User user = new User("Test User", "test@example.com", "hash", Role.USER);
        user.setId(42L);

        String token = jwtUtil.generateToken(user);
        assertNotNull(token);
        assertTrue(jwtUtil.validateToken(token));
        assertEquals(42L, jwtUtil.extractUserId(token));
    }

    @Test
    void testInvalidToken() {
        assertFalse(jwtUtil.validateToken("invalid.token.here"));
    }

    @Test
    void testShortSecretFailsStartup() {
        JwtUtil badUtil = new JwtUtil();
        ReflectionTestUtils.setField(badUtil, "secret", "too-short");
        assertThrows(IllegalStateException.class, badUtil::init);
    }
}
