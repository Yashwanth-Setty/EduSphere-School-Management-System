import { Role } from "@spira/types";

export type Module =
  | "students"
  | "attendance"
  | "courses"
  | "assignments"
  | "exams"
  | "fees"
  | "documents"
  | "announcements"
  | "analytics"
  | "ai";

const CREATE: Record<Module, Role[]> = {
  students:      [Role.ADMIN, Role.PRINCIPAL],
  attendance:    [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  courses:       [Role.ADMIN, Role.PRINCIPAL],
  assignments:   [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  exams:         [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  fees:          [Role.ADMIN, Role.ACCOUNTANT],
  documents:     [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.COUNSELOR, Role.ACCOUNTANT],
  announcements: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  analytics:     [],
  ai:            [Role.ADMIN, Role.PRINCIPAL],
};

const EDIT: Record<Module, Role[]> = { ...CREATE };

const DELETE: Record<Module, Role[]> = {
  ...CREATE,
  students: [Role.ADMIN],
  courses:  [Role.ADMIN],
  fees:     [Role.ADMIN, Role.ACCOUNTANT],
};

export function canCreate(roles: Role[], module: Module): boolean {
  return CREATE[module].some((r) => roles.includes(r));
}
export function canEdit(roles: Role[], module: Module): boolean {
  return EDIT[module].some((r) => roles.includes(r));
}
export function canDelete(roles: Role[], module: Module): boolean {
  return DELETE[module].some((r) => roles.includes(r));
}
export function canSubmitAssignment(roles: Role[]): boolean {
  return roles.includes(Role.STUDENT);
}
export function canPayInvoice(roles: Role[]): boolean {
  return roles.includes(Role.STUDENT) || roles.includes(Role.PARENT);
}
