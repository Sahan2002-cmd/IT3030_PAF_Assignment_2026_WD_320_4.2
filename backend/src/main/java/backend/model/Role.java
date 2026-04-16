package backend.model;

public enum Role {
    ADMIN,
    STUDENT,
    TECHNICIAN;

    public static Role from(String value) {
        return Role.valueOf(value.trim().toUpperCase());
    }
}
