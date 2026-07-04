package com.ayches.hotelerp.common.exception;

/** Violation of a domain rule (invalid state transition, dates, etc.) — maps to 422. */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
