"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { AuthUser } from "@spira/types";

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomLabel?: string;
  courseOffering: {
    course: { code: string; name: string };
    section: { name: string };
  };
}

interface AttendanceSession {
  id: string;
  sessionDate: string;
  periodNumber: number;
  submittedAt?: string;
  section: { name: string };
}

interface Paged<T> { data: T[]; total: number }

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function TeacherDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ready = mounted && !!getAccessToken();
  const todayDow = (new Date().getDay() + 6) % 7; // Mon=0

  const { data: slots } = useSWR<{ data: TimetableSlot[] }>(
    ready ? "/timetable/slots" : null,
    (url: string) => apiClient.get<{ data: TimetableSlot[] }>(url),
  );

  const { data: sessions } = useSWR<Paged<AttendanceSession>>(
    ready ? "/attendance/sessions?page=1&pageSize=50" : null,
    (url: string) => apiClient.get<Paged<AttendanceSession>>(url),
  );

  const { data: assignments } = useSWR<{ total: number }>(
    ready ? "/assignments?page=1&pageSize=1" : null,
    (url: string) => apiClient.get<{ total: number }>(url),
  );

  const { data: exams } = useSWR<{ total: number }>(
    ready ? "/exams?page=1&pageSize=1" : null,
    (url: string) => apiClient.get<{ total: number }>(url),
  );

  const todaySlots = (slots?.data ?? []).filter((s) => s.dayOfWeek === todayDow)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  const pendingSessions = (sessions?.data ?? []).filter((s) => !s.submittedAt);

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-900">Teacher Dashboard</h1>
        <p className="text-text-500 text-sm mt-1">
          Welcome back, <span className="font-medium text-text-700">{user.displayName}</span> · {DAY_NAMES[todayDow]}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Today&apos;s Classes</p>
          <p className="text-2xl font-bold text-text-900">{todaySlots.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Attendance Pending</p>
          <p className={`text-2xl font-bold ${pendingSessions.length > 0 ? "text-warning" : "text-success"}`}>
            {pendingSessions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Total Assignments</p>
          <p className="text-2xl font-bold text-text-900">{assignments?.total ?? "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Total Exams</p>
          <p className="text-2xl font-bold text-text-900">{exams?.total ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's timetable */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-900 mb-4">Today&apos;s Timetable</h2>
          {todaySlots.length === 0 ? (
            <p className="text-sm text-text-500">No classes scheduled today.</p>
          ) : (
            <div className="space-y-2">
              {todaySlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-4 p-3 rounded-md bg-surface-50 border border-surface-100">
                  <div className="text-xs text-text-400 w-20 shrink-0">
                    {slot.startTime} – {slot.endTime}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-900 truncate">{slot.courseOffering.course.name}</p>
                    <p className="text-xs text-text-500">{slot.courseOffering.section.name} · {slot.roomLabel ?? "—"}</p>
                  </div>
                  <span className="text-xs font-mono text-spira-700">{slot.courseOffering.course.code}</span>
                </div>
              ))}
            </div>
          )}

          {pendingSessions.length > 0 && (
            <div className="mt-4 p-3 rounded-md bg-warning/10 border border-warning/20">
              <p className="text-sm font-medium text-warning mb-2">⚠ {pendingSessions.length} attendance session{pendingSessions.length > 1 ? "s" : ""} not yet submitted</p>
              <div className="space-y-1">
                {pendingSessions.slice(0, 3).map((s) => (
                  <Link key={s.id} href={`/attendance/${s.id}`} className="block text-xs text-warning hover:underline">
                    {s.section.name} · {new Date(s.sessionDate).toLocaleDateString("en-IN", { timeZone: "UTC" })} · Period {s.periodNumber}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-900 mb-4">Quick Actions</h2>
          <div className="space-y-1">
            {[
              { label: "Mark Attendance", icon: "📋", href: "/attendance/new" },
              { label: "Create Assignment", icon: "📝", href: "/assignments/new" },
              { label: "Enter Exam Results", icon: "📊", href: "/exams/new" },
              { label: "View Timetable", icon: "📅", href: "/timetable" },
              { label: "Announcements", icon: "📢", href: "/announcements" },
            ].map((a) => (
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
