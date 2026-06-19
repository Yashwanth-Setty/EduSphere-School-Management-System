export declare enum Role {
    ADMIN = "admin",
    PRINCIPAL = "principal",
    TEACHER = "teacher",
    STUDENT = "student",
    PARENT = "parent",
    ACCOUNTANT = "accountant",
    COUNSELOR = "counselor"
}
export declare const ALL_ROLES: Role[];
export declare const ROLE_PERMISSIONS: Record<Role, string[]>;
