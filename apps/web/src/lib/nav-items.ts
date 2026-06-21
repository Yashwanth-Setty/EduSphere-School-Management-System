import { Role } from "@spira/types";

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
    icon: "⬛",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "Students",
    href: "/students",
    icon: "🎓",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  },
  {
    label: "Staff",
    href: "/staff",
    icon: "👨‍🏫",
    roles: [Role.ADMIN, Role.PRINCIPAL],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: "📋",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  },
  {
    label: "Timetable",
    href: "/timetable",
    icon: "📅",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: "📚",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER],
  },
  {
    label: "Assignments",
    href: "/assignments",
    icon: "📝",
    roles: [Role.TEACHER, Role.STUDENT],
  },
  {
    label: "Exams & Results",
    href: "/exams",
    icon: "📊",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Fees",
    href: "/fees",
    icon: "💰",
    roles: [Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Communication",
    href: "/announcements",
    icon: "📢",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "📄",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "📈",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT, Role.COUNSELOR],
  },
  {
    label: "AI Insights",
    href: "/ai",
    icon: "🤖",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.COUNSELOR],
  },
  {
    label: "Transport",
    href: "/transport",
    icon: "🚌",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.STUDENT, Role.PARENT],
  },
  {
    label: "Online Classes",
    href: "/online-classes",
    icon: "🎥",
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT],
  },
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: "💬",
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
