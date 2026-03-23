package com.journal.backend.enums;

public enum Role {
    USER,
    ADMIN;

    public static final String ROLE_PREFIX = "ROLE_";

    public String authority() {
        return ROLE_PREFIX + name();
    }
}
