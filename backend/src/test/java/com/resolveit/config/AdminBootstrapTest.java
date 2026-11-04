package com.resolveit.config;

import com.resolveit.model.Role;
import com.resolveit.model.User;
import com.resolveit.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminBootstrap adminBootstrap;

    @BeforeEach
    void setUp() {
        adminBootstrap = new AdminBootstrap(userRepository, passwordEncoder);
    }

    @Test
    void bootstrapsWhenConfiguredAndNoAdmin() {
        ReflectionTestUtils.setField(adminBootstrap, "adminEmail", "bootstrap.admin@example.com");
        ReflectionTestUtils.setField(adminBootstrap, "adminPassword", "SecureAdmin123");
        ReflectionTestUtils.setField(adminBootstrap, "adminName", "System Admin");

        when(userRepository.countByRole(Role.ADMIN)).thenReturn(0L);
        when(userRepository.existsByEmail("bootstrap.admin@example.com")).thenReturn(false);
        when(passwordEncoder.encode("SecureAdmin123")).thenReturn("encodedPassword");

        adminBootstrap.run();

        verify(userRepository).save(any(User.class));
    }

    @Test
    void doesNotBootstrapWhenAdminAlreadyExists() {
        ReflectionTestUtils.setField(adminBootstrap, "adminEmail", "bootstrap.admin@example.com");
        ReflectionTestUtils.setField(adminBootstrap, "adminPassword", "SecureAdmin123");

        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);

        adminBootstrap.run();

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void doesNotBootstrapWhenPropertiesEmpty() {
        ReflectionTestUtils.setField(adminBootstrap, "adminEmail", "");
        ReflectionTestUtils.setField(adminBootstrap, "adminPassword", "");

        adminBootstrap.run();

        verify(userRepository, never()).countByRole(any());
        verify(userRepository, never()).save(any(User.class));
    }
}
