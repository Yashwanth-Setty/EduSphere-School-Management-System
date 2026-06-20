"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
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

const REPORT_LINKS = [
  { href: "/analytics/attendance", label: "Attendance Report", icon: "📋", desc: "Session-level presence rates by section and date range" },
  { href: "/analytics/academic", label: "Academic Performance", icon: "📊", desc: "Exam averages and pass rates per course and section" },
  { href: "/analytics/finance", label: "Finance Report", icon: "💰", desc: "Monthly fee collection summary and outstanding balances" },
];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useSWR<Overview>(
    mounted && !!getAccessToken() ? "/analytics/overview" : null,
    (url: string) => apiClient.get<Overview>(url),
  );

  const kpis = [
    { label: "Active Students", value: data?.totalStudents, color: "text-spira-900" },
    { label: "Present Today", value: data?.presentToday, color: "text-green-700" },
    { label: "Pending Fee Invoices", value: data?.pendingFees, color: "text-yellow-700" },
    { label: "Active Announcements", value: data?.activeAnnouncements, color: "text-blue-700" },
    { label: "Active Staff", value: data?.totalStaff, color: "text-text-900" },
    { label: "Active Courses", value: data?.totalCourses, color: "text-text-900" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-900">Analytics</h1>
        <p className="text-text-500 text-sm mt-1">School-wide reports and performance insights</p>
      </div>

      {/* KPI cards */}
      <section>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-lg border border-border shadow-sm p-3 md:p-4">
              <p className="text-text-400 text-xs uppercase tracking-wide mb-1 leading-tight">{k.label}</p>
              {isLoading
                ? <div className="h-7 w-12 bg-surface-100 rounded animate-pulse" />
                : <p className={`text-2xl font-bold ${k.color}`}>{k.value ?? "—"}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Report links */}
      <section>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Reports</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {REPORT_LINKS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="bg-white rounded-lg border border-border shadow-sm p-5 hover:border-spira-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className="font-semibold text-text-900 group-hover:text-spira-800 transition-colors">{r.label}</p>
                  <p className="text-sm text-text-500 mt-1">{r.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
