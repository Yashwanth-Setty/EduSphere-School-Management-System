import { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "â¬›",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "Students",
    href: "/students",
    icon: "ðŸŽ“",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  },
  {
    label: "Staff",
    href: "/staff",
    icon: "ðŸ‘¨â€ðŸ«",
    roles: [Role.ADMIN, Role.PRINCIPAL],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: "ðŸ“‹",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  },
  {
    label: "Timetable",
    href: "/timetable",
    icon: "ðŸ“…",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: "ðŸ“š",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  },
  {
    label: "Assignments",
    href: "/assignments",
    icon: "ðŸ“",
    roles: [Role.TEACHER, Role.STUDENT],
  },
  {
    label: "Exams & Results",
    href: "/exams",
    icon: "ðŸ“Š",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Fees",
    href: "/fees",
    icon: "ðŸ’°",
    roles: [Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Communication",
    href: "/announcements",
    icon: "ðŸ“¢",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "ðŸ“„",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "ðŸ“ˆ",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "AI Insights",
    href: "/ai",
    icon: "ðŸ¤–",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.COUNSELOR],
  },
  {
    label: "Transport",
    href: "/transport",
    icon: "ðŸšŒ",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Online Classes",
    href: "/online-classes",
    icon: "ðŸŽ¥",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT],
  },
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: "ðŸ’¬",
    roles: [Role.STUDENT],
  },
];

/** Bottom tab definitions per role (3 tabs + More) */
export const ROLE_BOTTOM_TABS: Record<string, string[]> = {
  [Role.ADMIN]:      ["/dashboard", "/students", "/attendance"],
  [Role.PRINCIPAL]:  ["/dashboard", "/students", "/attendance"],
  [Role.TEACHER]:    ["/dashboard", "/attendance", "/assignments"],
  [Role.STUDENT]:    ["/dashboard", "/online-classes", "/assistant"],
  [Role.PARENT]:     ["/dashboard", "/fees", "/transport"],
  [Role.ACCOUNTANT]: ["/dashboard", "/fees", "/analytics"],
  [Role.COUNSELOR]:  ["/dashboard", "/documents", "/ai"],
};
