import { Role } from "@/types";
import type { AuthUser, LoginResponse } from "@/types";

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@mail.com": {
    password: "Password@123",
    user: { id: "demo-admin", email: "admin@mail.com", displayName: "SPIRA Admin", roles: [Role.ADMIN], schoolId: "0000" },
  },
  "principal@mail.com": {
    password: "Password@123",
    user: { id: "demo-principal", email: "principal@mail.com", displayName: "Dr. Meena Sharma", roles: [Role.PRINCIPAL], schoolId: "0000" },
  },
  "teacher@mail.com": {
    password: "Password@123",
    user: { id: "demo-teacher", email: "teacher@mail.com", displayName: "Raj Kumar", roles: [Role.TEACHER], schoolId: "0000" },
  },
  "student@mail.com": {
    password: "Password@123",
    user: { id: "demo-student", email: "student@mail.com", displayName: "Ava Patel", roles: [Role.STUDENT], schoolId: "0000" },
  },
  "parent@mail.com": {
    password: "Password@123",
    user: { id: "demo-parent", email: "parent@mail.com", displayName: "Anjali Patel", roles: [Role.PARENT], schoolId: "0000" },
  },
  "accountant@mail.com": {
    password: "Password@123",
    user: { id: "demo-accountant", email: "accountant@mail.com", displayName: "Priya Accounts", roles: [Role.ACCOUNTANT], schoolId: "0000" },
  },
  "counselor@mail.com": {
    password: "Password@123",
    user: { id: "demo-counselor", email: "counselor@mail.com", displayName: "Sunita Counsel", roles: [Role.COUNSELOR], schoolId: "0000" },
  },
};

const MOCK_TOKEN_PREFIX = "mock_spira_";

export function isMockToken(token: string): boolean {
  return token.startsWith(MOCK_TOKEN_PREFIX);
}

export function mockGetUserFromToken(token: string): AuthUser | null {
  const email = token.slice(MOCK_TOKEN_PREFIX.length);
  return DEMO_USERS[email]?.user ?? null;
}

export function mockLogin(
  schoolCode: string,
  email: string,
  password: string,
): LoginResponse {
  if (schoolCode !== "0000") throw new Error("Invalid school code");
  const entry = DEMO_USERS[email.toLowerCase()];
  if (!entry || entry.password !== password) throw new Error("Invalid email or password");
  const token = `${MOCK_TOKEN_PREFIX}${email.toLowerCase()}`;
  return {
    accessToken: token,
    refreshToken: token,
    expiresIn: 900,
    user: entry.user,
  };
}
