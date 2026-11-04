package com.resolveit.config;

import com.resolveit.model.Notification;
import com.resolveit.model.User;
import com.resolveit.repository.CommentRepository;
import com.resolveit.repository.ComplaintRepository;
import com.resolveit.repository.NotificationRepository;
import com.resolveit.repository.StatusHistoryRepository;
import com.resolveit.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DemoDataLoaderTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private StatusHistoryRepository historyRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private Environment environment;

    private DemoDataLoader demoDataLoader;

    private static final String TEST_ONLY_SEED_PASSWORD = "TestOnlyMockPassword123!";

    @BeforeEach
    void setUp() {
        demoDataLoader = new DemoDataLoader(
                userRepository,
                complaintRepository,
                commentRepository,
                historyRepository,
                notificationRepository,
                passwordEncoder,
                environment
        );
    }

    @Test
    void runsWhenEnabledAndDatabaseEmpty() {
        ReflectionTestUtils.setField(demoDataLoader, "seedEnabled", true);
        ReflectionTestUtils.setField(demoDataLoader, "demoPassword", TEST_ONLY_SEED_PASSWORD);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});
        when(userRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(TEST_ONLY_SEED_PASSWORD)).thenReturn("encodedDemo");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(complaintRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        demoDataLoader.run();

        verify(userRepository, atLeast(5)).save(any(User.class));
        verify(complaintRepository, atLeast(12)).save(any());
        verify(notificationRepository, atLeast(2)).save(any(Notification.class));
    }

    @Test
    void doesNotRunWhenDisabled() {
        ReflectionTestUtils.setField(demoDataLoader, "seedEnabled", false);
        demoDataLoader.run();
        verifyNoInteractions(userRepository, complaintRepository, notificationRepository);
    }

    @Test
    void doesNotRunInProdProfile() {
        ReflectionTestUtils.setField(demoDataLoader, "seedEnabled", true);
        ReflectionTestUtils.setField(demoDataLoader, "demoPassword", TEST_ONLY_SEED_PASSWORD);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        demoDataLoader.run();

        verify(userRepository, never()).count();
        verify(userRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void doesNotRunWhenDatabaseAlreadyHasUsers() {
        ReflectionTestUtils.setField(demoDataLoader, "seedEnabled", true);
        ReflectionTestUtils.setField(demoDataLoader, "demoPassword", TEST_ONLY_SEED_PASSWORD);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"local"});
        when(userRepository.count()).thenReturn(3L);

        demoDataLoader.run();

        verify(userRepository, never()).save(any());
        verify(complaintRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }
}
