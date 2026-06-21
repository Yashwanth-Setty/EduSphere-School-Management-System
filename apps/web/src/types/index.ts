export enum Role {
  ADMIN = "admin",
  PRINCIPAL = "principal",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
  ACCOUNTANT = "accountant",
  COUNSELOR = "counselor",
}

export const ALL_ROLES = Object.values(Role);

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  schoolId: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  schoolId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type DocumentCategory =
  | "report_card"
  | "fee_receipt"
  | "id_document"
  | "medical_note"
  | "consent_form"
  | "certificate"
  | "assignment_attachment";

export type VisibilityScope =
  | "self"
  | "linked_parent"
  | "teacher_assigned"
  | "school_admin"
  | "finance_only"
  | "counselor_restricted";
