"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "@/components/layout/KpiCard";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Overview {
  totalStudents: number;
  presentToday: number;
  pendingFees: number;
  activeAnnouncements: number;
  totalStaff: number;
  totalCourses: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data } = useSWR<Overview>(
    mounted && !!getAccessToken() ? "/analytics/overview" : null,
    (url: string) => apiClient.get<Overview>(url),
  );

  const attendanceRate = data
    ? data.totalStudents > 0
      ? Math.round((data.presentToday / data.totalStudents) * 100)
      : 0
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-900">Dashboard</h1>
        <p className="text-text-500 text-sm mt-1">
          Welcome back, <span className="font-medium text-text-700">{user?.displayName ?? "…"}</span>
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Students"
          value={data ? String(data.totalStudents) : "—"}
          trend={null}
          icon="🎓"
        />
        <KpiCard
          label="Present Today"
          value={data ? `${data.presentToday} (${attendanceRate}%)` : "—"}
          trend={null}
          icon="✅"
        />
        <KpiCard
          label="Pending Fees"
          value={data ? String(data.pendingFees) : "—"}
          trend={null}
          icon="💰"
        />
        <KpiCard
          label="Announcements"
          value={data ? String(data.activeAnnouncements) : "—"}
          trend={null}
          icon="📢"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard label="Active Staff" value={data ? String(data.totalStaff) : "—"} trend={null} icon="👨‍🏫" />
        <KpiCard label="Active Courses" value={data ? String(data.totalCourses) : "—"} trend={null} icon="📚" />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { label: "Attendance session opened — Grade 8-A", time: "Just now", icon: "📋" },
              { label: "New student enrolled — Ava Patel", time: "2h ago", icon: "🎓" },
              { label: "Fee invoices generated for Q1", time: "Yesterday", icon: "💰" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-surface-100 last:border-0">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm text-text-700">{item.label}</p>
                  <p className="text-xs text-text-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
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

const QUICK_ACTIONS = [
  { label: "Mark attendance", icon: "📋", href: "/attendance/new" },
  { label: "Create announcement", icon: "📢", href: "/announcements/new" },
  { label: "Generate invoices", icon: "💰", href: "/fees/new" },
  { label: "Add student", icon: "➕", href: "/students" },
  { label: "View reports", icon: "📊", href: "/analytics" },
];
