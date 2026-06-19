"use client";

import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "@/components/layout/KpiCard";

export default function DashboardPage() {
  const { user } = useAuth();

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
        <KpiCard label="Total Students" value="—" trend={null} icon="🎓" />
        <KpiCard label="Present Today" value="—" trend={null} icon="✅" />
        <KpiCard label="Pending Fees" value="—" trend={null} icon="💰" />
        <KpiCard label="Announcements" value="—" trend={null} icon="📢" />
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
              <button
                key={a.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors text-left"
              >
                <span className="text-base">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Mark attendance", icon: "📋" },
  { label: "Create announcement", icon: "📢" },
  { label: "Generate invoices", icon: "💰" },
  { label: "Add student", icon: "➕" },
  { label: "View reports", icon: "📊" },
];
