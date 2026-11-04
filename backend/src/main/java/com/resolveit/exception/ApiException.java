package com.resolveit.exception;

import org.springframework.http.HttpStatus;

/**
 * Single custom exception class for all business and client errors.
 * It stores an HTTP status code and a clear error message.
 */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
