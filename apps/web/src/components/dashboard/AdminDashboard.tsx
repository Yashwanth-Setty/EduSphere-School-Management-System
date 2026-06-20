"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { KpiCard } from "@/components/layout/KpiCard";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { AuthUser, Role } from "@spira/types";
import { canCreate } from "@/lib/permissions";

interface Overview {
  totalStudents: number;
  presentToday: number;
  pendingFees: number;
  activeAnnouncements: number;
  totalStaff: number;
  totalCourses: number;
}

const ALL_QUICK_ACTIONS = [
  { label: "Add Student", icon: "🎓", href: "/students", module: "students" as const },
  { label: "Generate Invoice", icon: "💰", href: "/fees/new", module: "fees" as const },
  { label: "Create Announcement", icon: "📢", href: "/announcements/new", module: "announcements" as const },
  { label: "Upload Document", icon: "📄", href: "/documents/new", module: "documents" as const },
  { label: "View Analytics", icon: "📈", href: "/analytics", module: "analytics" as const },
  { label: "AI Insights", icon: "🤖", href: "/ai", module: "ai" as const },
];

const ROLE_TITLES: Partial<Record<Role, string>> = {
  [Role.PRINCIPAL]: "Principal Dashboard",
  [Role.ACCOUNTANT]: "Accountant Dashboard",
  [Role.COUNSELOR]: "Counselor Dashboard",
};

export function AdminDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user.roles ?? []) as Role[];
  const primaryRole = roles[0] ?? Role.ADMIN;
  const dashboardTitle = ROLE_TITLES[primaryRole] ?? "Admin Dashboard";

  const quickActions = ALL_QUICK_ACTIONS.filter(
    (a) => a.module === "analytics" || canCreate(roles, a.module),
  );

  const { data } = useSWR<Overview>(
    mounted && !!getAccessToken() ? "/analytics/overview" : null,
    (url: string) => apiClient.get<Overview>(url),
  );

  const attendanceRate = data && data.totalStudents > 0
    ? Math.round((data.presentToday / data.totalStudents) * 100)
    : null;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-900">{dashboardTitle}</h1>
        <p className="text-text-500 text-sm mt-1">
          Welcome back, <span className="font-medium text-text-700">{user.displayName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Students" value={data ? String(data.totalStudents) : "—"} trend={null} icon="🎓" />
        <KpiCard label="Present Today" value={data ? `${data.presentToday}${attendanceRate !== null ? ` (${attendanceRate}%)` : ""}` : "—"} trend={null} icon="✅" />
        <KpiCard label="Pending Fees" value={data ? String(data.pendingFees) : "—"} trend={null} icon="💰" />
        <KpiCard label="Announcements" value={data ? String(data.activeAnnouncements) : "—"} trend={null} icon="📢" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard label="Active Staff" value={data ? String(data.totalStaff) : "—"} trend={null} icon="👨‍🏫" />
        <KpiCard label="Active Courses" value={data ? String(data.totalCourses) : "—"} trend={null} icon="📚" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-900 mb-4">Module Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Analytics & Reports", href: "/analytics", icon: "📈" },
              { label: "AI Insights", href: "/ai", icon: "🤖" },
              { label: "Fee Management", href: "/fees/dashboard", icon: "💰" },
              { label: "Student Records", href: "/students", icon: "🎓" },
              { label: "Attendance", href: "/attendance", icon: "📋" },
              { label: "Exams & Results", href: "/exams", icon: "📊" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-md border border-surface-100 hover:border-spira-300 hover:bg-surface-50 transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-text-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-900 mb-4">Quick Actions</h2>
          <div className="space-y-1">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors"
              >
                <span className="text-base">{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
