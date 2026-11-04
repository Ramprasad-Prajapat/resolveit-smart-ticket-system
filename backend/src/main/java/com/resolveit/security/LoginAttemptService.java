package com.resolveit.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * In-memory brute force protection for user login attempts.
 * Locks an email address for a cooldown period after repeated failed passwords.
 */
@Service
public class LoginAttemptService {

    @Value("${app.security.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.login.window-minutes:15}")
    private long windowMinutes;

    @Value("${app.security.login.lock-minutes:15}")
    private long lockMinutes;

    private static class AttemptData {
        int failureCount = 0;
        Instant firstFailureTime = Instant.now();
        Instant lockedUntil = null;
    }

    private final Map<String, AttemptData> attemptsMap = new HashMap<>();

    public synchronized boolean isLocked(String email) {
        if (email == null) {
            return false;
        }
        String key = email.trim().toLowerCase();
        AttemptData data = attemptsMap.get(key);
        if (data == null) {
            return false;
        }

        Instant now = Instant.now();
        if (data.lockedUntil != null) {
            if (now.isBefore(data.lockedUntil)) {
                return true;
            } else {
                // Lock expired, reset entry
                attemptsMap.remove(key);
                return false;
            }
        }

        // Check if window has expired without locking
        if (Duration.between(data.firstFailureTime, now).toMinutes() >= windowMinutes) {
            attemptsMap.remove(key);
            return false;
        }

        return false;
    }

    public synchronized long getRemainingLockMinutes(String email) {
        if (email == null) {
            return 0;
        }
        String key = email.trim().toLowerCase();
        AttemptData data = attemptsMap.get(key);
        if (data == null || data.lockedUntil == null) {
            return 0;
        }
        Instant now = Instant.now();
        long seconds = Duration.between(now, data.lockedUntil).getSeconds();
        if (seconds <= 0) {
            return 0;
        }
        long minutes = (seconds + 59) / 60; // round up to whole minutes
        return Math.max(1, minutes);
    }

    public synchronized void recordFailure(String email) {
        if (email == null) {
            return;
        }
        String key = email.trim().toLowerCase();
        Instant now = Instant.now();
        AttemptData data = attemptsMap.get(key);

        if (data == null || Duration.between(data.firstFailureTime, now).toMinutes() >= windowMinutes) {
            data = new AttemptData();
            data.failureCount = 1;
            data.firstFailureTime = now;
            attemptsMap.put(key, data);
        } else {
            data.failureCount++;
        }

        if (data.failureCount >= maxAttempts) {
            data.lockedUntil = now.plus(Duration.ofMinutes(lockMinutes));
        }
    }

    public synchronized void recordSuccess(String email) {
        if (email != null) {
            attemptsMap.remove(email.trim().toLowerCase());
        }
    }

    public synchronized void resetAll() {
        attemptsMap.clear();
    }
}
