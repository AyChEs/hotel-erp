package com.ayches.hotelerp.common.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String resource, Object id) {
        super(resource + " not found: " + id);
    }

    public NotFoundException(String message) {
        super(message);
    }
}
