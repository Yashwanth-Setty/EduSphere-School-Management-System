"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { AuthUser } from "@spira/types";

// ── Static mock data ────────────────────────────────────────────────────────

const MY_CLASSES = [
  { id: "1", subject: "Mathematics",    code: "MATH-8", section: "Grade 8-A", students: 32, room: "Room 101", color: "#6366f1" },
  { id: "2", subject: "Mathematics",    code: "MATH-7", section: "Grade 7-B", students: 30, room: "Room 101", color: "#6366f1" },
  { id: "3", subject: "Mathematics",    code: "MATH-9", section: "Grade 9-A", students: 28, room: "Room 202", color: "#6366f1" },
];

const STUDENT_PERFORMANCE = [
  { name: "Ava Patel",    marks: 44, max: 50, attendance: 92, grade: "A"  },
  { name: "Rohan Mehta",  marks: 38, max: 50, attendance: 88, grade: "B+" },
  { name: "Priya Singh",  marks: 47, max: 50, attendance: 96, grade: "A+" },
  { name: "Aryan Gupta",  marks: 35, max: 50, attendance: 80, grade: "B"  },
  { name: "Sneha Joshi",  marks: 41, max: 50, attendance: 90, grade: "A"  },
  { name: "Karan Patel",  marks: 29, max: 50, attendance: 72, grade: "C+" },
];

const RECENT_ASSIGNMENTS = [
  { id: "1", title: "Chapter 5 – Linear Equations Ex 5.3", class: "Grade 8-A", dueDate: "2026-06-28", submitted: 24, total: 32, status: "active" },
  { id: "2", title: "Practice Set – Quadratic Equations",   class: "Grade 9-A", dueDate: "2026-07-02", submitted: 20, total: 28, status: "active" },
  { id: "3", title: "Chapter 3 – Fractions Worksheet",      class: "Grade 7-B", dueDate: "2026-06-21", submitted: 30, total: 30, status: "closed" },
];

const PARENT_MESSAGES = [
  { id: "1", parent: "Mr. Rajesh Patel",  child: "Ava Patel",    message: "Can you please schedule a meeting to discuss Ava's progress?", time: "2 hours ago", avatar: "RP", unread: true },
  { id: "2", parent: "Mrs. Sunita Mehta", child: "Rohan Mehta",  message: "Rohan was absent due to illness. Please share missed notes.", time: "Yesterday",  avatar: "SM", unread: true },
  { id: "3", parent: "Mr. Anil Gupta",    child: "Aryan Gupta",  message: "Thank you for the additional worksheets. Very helpful.", time: "2 days ago",  avatar: "AG", unread: false },
];

const EXAM_SCHEDULE = [
  { id: "1", title: "Math Mid-term",       class: "Grade 8-A", date: "2026-08-20", maxMarks: 50, status: "upcoming" },
  { id: "2", title: "Math Mid-term",       class: "Grade 7-B", date: "2026-08-21", maxMarks: 50, status: "upcoming" },
  { id: "3", title: "Math Mid-term",       class: "Grade 9-A", date: "2026-08-22", maxMarks: 50, status: "upcoming" },
  { id: "4", title: "Chapter 3 Unit Test", class: "Grade 7-B", date: "2026-07-01", maxMarks: 20, status: "upcoming" },
];

const ATTENDANCE_TODAY = [
  { name: "Ava Patel",    rollNo: "8A-12", status: "present" },
  { name: "Rohan Mehta",  rollNo: "8A-07", status: "absent"  },
  { name: "Priya Singh",  rollNo: "8A-23", status: "present" },
  { name: "Aryan Gupta",  rollNo: "8A-05", status: "present" },
  { name: "Sneha Joshi",  rollNo: "8A-18", status: "late"    },
  { name: "Karan Patel",  rollNo: "8A-09", status: "present" },
];

const PERF_BAR_COLOR = (marks: number, max: number) => {
  const pct = marks / max;
  return pct >= 0.85 ? "#22c55e" : pct >= 0.70 ? "#6366f1" : pct >= 0.55 ? "#f59e0b" : "#ef4444";
};

const STATUS_STYLES: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent:  "bg-red-100 text-red-700",
  late:    "bg-yellow-100 text-yellow-700",
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  "A":  "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  "B":  "bg-sky-100 text-sky-700",
  "C+": "bg-yellow-100 text-yellow-700",
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Types ───────────────────────────────────────────────────────────────────

interface TimetableSlot { id: string; dayOfWeek: number; periodNumber: number; startTime: string; endTime: string; roomLabel?: string; courseOffering: { course: { code: string; name: string }; section: { name: string } } }
interface AttendanceSession { id: string; sessionDate: string; periodNumber: number; submittedAt?: string; section: { name: string } }
interface Paged<T> { data: T[]; total: number }

// ── Main component ──────────────────────────────────────────────────────────

export function TeacherDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "attendance" | "marks" | "messages" | "exams">("overview");
  const [msgOpen, setMsgOpen] = useState<typeof PARENT_MESSAGES[0] | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>(() =>
    Object.fromEntries(ATTENDANCE_TODAY.map(s => [s.rollNo, s.status]))
  );
  useEffect(() => { setMounted(true); }, []);

  const ready = mounted && !!getAccessToken();
  const todayDow = (new Date().getDay() + 6) % 7;

  const { data: slotsRaw } = useSWR<{ data: TimetableSlot[] } | TimetableSlot[]>(
    ready ? "/timetable/slots" : null,
    (url: string) => apiClient.get<{ data: TimetableSlot[] } | TimetableSlot[]>(url),
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

  const slots: TimetableSlot[] = Array.isArray(slotsRaw) ? slotsRaw : (slotsRaw as { data: TimetableSlot[] })?.data ?? [];
  const todaySlots = slots.filter((s) => s.dayOfWeek === todayDow).sort((a, b) => a.periodNumber - b.periodNumber);
  const pendingSessions = (sessions?.data ?? []).filter((s) => !s.submittedAt);

  const unreadMsgs = PARENT_MESSAGES.filter(m => m.unread).length;

  const TABS = [
    { key: "overview",    label: "Overview"    },
    { key: "classes",     label: "My Classes"  },
    { key: "attendance",  label: "Attendance"  },
    { key: "marks",       label: "Marks Entry" },
    { key: "messages",    label: `Messages${unreadMsgs > 0 ? ` (${unreadMsgs})` : ""}` },
    { key: "exams",       label: "Exams"       },
  ] as const;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-900">Teacher Dashboard</h1>
        <p className="text-text-500 text-sm mt-1">Welcome back, <span className="font-medium text-text-700">{user.displayName}</span> · {DAY_NAMES[todayDow]}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/timetable" className="bg-gradient-to-br from-spira-600 to-spira-800 rounded-xl p-4 text-white shadow-sm hover:brightness-110 transition-all">
          <p className="text-spira-200 text-xs font-medium uppercase tracking-wide mb-1">Today&apos;s Classes</p>
          <p className="text-3xl font-bold">{todaySlots.length || MY_CLASSES.length}</p>
          <p className="text-spira-200 text-xs mt-1">scheduled</p>
        </Link>
        <Link href="/attendance" className={`rounded-xl p-4 text-white shadow-sm hover:brightness-110 transition-all ${pendingSessions.length > 0 ? "bg-gradient-to-br from-orange-500 to-orange-700" : "bg-gradient-to-br from-emerald-500 to-emerald-700"}`}>
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">Pending Attendance</p>
          <p className="text-3xl font-bold">{pendingSessions.length}</p>
          <p className="text-white/70 text-xs mt-1">{pendingSessions.length > 0 ? "sessions" : "all done"}</p>
        </Link>
        <button onClick={() => setActiveTab("messages")} className="text-left bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white shadow-sm hover:brightness-110 transition-all">
          <p className="text-purple-100 text-xs font-medium uppercase tracking-wide mb-1">Parent Messages</p>
          <p className="text-3xl font-bold">{unreadMsgs}</p>
          <p className="text-purple-100 text-xs mt-1">unread</p>
        </button>
        <Link href="/assignments" className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white shadow-sm hover:brightness-110 transition-all">
          <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Assignments</p>
          <p className="text-3xl font-bold">{assignments?.total ?? RECENT_ASSIGNMENTS.length}</p>
          <p className="text-blue-100 text-xs mt-1">total</p>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-px">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.key ? "border-spira-700 text-spira-700" : "border-transparent text-text-500 hover:text-text-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Today's timetable */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-900">Today&apos;s Timetable</h2>
                <Link href="/timetable" className="text-xs text-spira-700 hover:underline">Full →</Link>
              </div>
              {MY_CLASSES.map((cls, i) => (
                <div key={cls.id} className="flex items-center gap-4 p-3 rounded-xl border border-surface-100 mb-2">
                  <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: cls.color }} />
                  <div className="text-xs text-text-400 w-20 shrink-0">0{8+i}:00 – 0{9+i}:00</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-900">{cls.subject}</p>
                    <p className="text-xs text-text-500">{cls.section} · {cls.room}</p>
                  </div>
                  <span className="text-xs font-mono text-spira-700">{cls.code}</span>
                </div>
              ))}
              {pendingSessions.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-sm font-medium text-warning">⚠ {pendingSessions.length} attendance session{pendingSessions.length > 1 ? "s" : ""} pending</p>
                </div>
              )}
            </div>

            {/* Assignments */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-900">Recent Assignments</h2>
                <Link href="/assignments" className="text-xs text-spira-700 hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {RECENT_ASSIGNMENTS.map((a) => {
                  const pct = Math.round((a.submitted / a.total) * 100);
                  return (
                    <div key={a.id} className="border border-surface-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-text-900">{a.title}</p>
                          <p className="text-xs text-text-500 mt-0.5">{a.class} · Due {new Date(a.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" })}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${a.status === "closed" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}`}>{a.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-100 rounded-full h-1.5">
                          <div className="bg-spira-600 rounded-full h-1.5" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-text-400 shrink-0">{a.submitted}/{a.total} submitted</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Student performance summary */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">Top Performers</h2>
                <button onClick={() => setActiveTab("marks")} className="text-xs text-spira-700 hover:underline">See all →</button>
              </div>
              <div className="space-y-2">
                {STUDENT_PERFORMANCE.sort((a, b) => b.marks - a.marks).slice(0, 5).map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-[10px] font-bold shrink-0">{s.name.split(" ").map(n => n[0]).join("")}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-900 truncate">{s.name}</p>
                      <div className="w-full bg-surface-100 rounded-full h-1 mt-0.5">
                        <div className="h-1 rounded-full" style={{ width: `${(s.marks / s.max) * 100}%`, backgroundColor: PERF_BAR_COLOR(s.marks, s.max) }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-text-700 shrink-0">{s.marks}/{s.max}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent messages */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">Parent Messages</h2>
                <button onClick={() => setActiveTab("messages")} className="text-xs text-spira-700 hover:underline">All →</button>
              </div>
              <div className="space-y-2">
                {PARENT_MESSAGES.slice(0, 3).map((m) => (
                  <button key={m.id} onClick={() => setMsgOpen(m)} className="w-full text-left p-2.5 rounded-lg hover:bg-surface-50 border border-surface-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold shrink-0">{m.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-900 truncate">{m.parent}</p>
                        <p className="text-[11px] text-text-400 truncate">{m.message}</p>
                      </div>
                      {m.unread && <span className="w-2 h-2 bg-spira-600 rounded-full shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <h2 className="text-sm font-semibold text-text-900 mb-3">Quick Actions</h2>
              <div className="space-y-1">
                {[
                  { label: "Mark Attendance", icon: "📋", action: () => setActiveTab("attendance") },
                  { label: "Enter Marks",      icon: "✏️", action: () => setActiveTab("marks") },
                  { label: "New Assignment",   icon: "📝", href: "/assignments/new" },
                  { label: "Schedule Exam",    icon: "📊", href: "/exams/new" },
                  { label: "Online Classes",   icon: "🎥", href: "/online-classes" },
                ].map((a) => (
                  a.href ? (
                    <Link key={a.label} href={a.href} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                      <span>{a.icon}</span>{a.label}
                    </Link>
                  ) : (
                    <button key={a.label} onClick={a.action} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                      <span>{a.icon}</span>{a.label}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Classes tab */}
      {activeTab === "classes" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MY_CLASSES.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border-2 border-border hover:border-spira-400 hover:shadow-md transition-all p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-black" style={{ backgroundColor: cls.color }}>M</div>
                <div>
                  <p className="font-semibold text-text-900">{cls.subject}</p>
                  <p className="text-xs text-text-400">{cls.code}</p>
                </div>
              </div>
              <p className="text-sm text-text-700 font-medium">{cls.section}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-text-400">
                <span>👥 {cls.students} students</span>
                <span>🏛 {cls.room}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setActiveTab("attendance")} className="flex-1 py-1.5 text-xs bg-surface-50 border border-border rounded-lg hover:bg-spira-50 hover:border-spira-300 transition-colors">Attendance</button>
                <button onClick={() => setActiveTab("marks")} className="flex-1 py-1.5 text-xs bg-surface-50 border border-border rounded-lg hover:bg-spira-50 hover:border-spira-300 transition-colors">Marks</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance tab */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-900">Mark Attendance – Grade 8-A</h2>
              <p className="text-xs text-text-400 mt-0.5">{new Date().toLocaleDateString("en-IN", { dateStyle: "full" })} · Period 1 (08:00 – 09:00)</p>
            </div>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-white">
              <option>Grade 8-A</option>
              <option>Grade 7-B</option>
              <option>Grade 9-A</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase">Roll No.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {ATTENDANCE_TODAY.map((s) => (
                  <tr key={s.rollNo} className="border-b border-surface-100">
                    <td className="px-4 py-3 text-xs font-mono text-text-400">{s.rollNo}</td>
                    <td className="px-4 py-3 font-medium text-text-900">{s.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {["present", "absent", "late"].map((st) => (
                          <button key={st} onClick={() => setAttendanceState(prev => ({ ...prev, [s.rollNo]: st }))}
                            className={`px-2.5 py-1 text-xs rounded-full font-medium capitalize border transition-all ${attendanceState[s.rollNo] === st ? STATUS_STYLES[st] + " border-current" : "border-border text-text-400 hover:bg-surface-50"}`}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-4 text-sm">
              <span className="text-green-700 font-medium">Present: {Object.values(attendanceState).filter(s => s === "present").length}</span>
              <span className="text-red-700 font-medium">Absent: {Object.values(attendanceState).filter(s => s === "absent").length}</span>
              <span className="text-yellow-700 font-medium">Late: {Object.values(attendanceState).filter(s => s === "late").length}</span>
            </div>
            <button className="px-5 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800 transition-colors">Submit Attendance</button>
          </div>
        </div>
      )}

      {/* Marks Entry tab */}
      {activeTab === "marks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-text-900">Marks Entry – Grade 8-A · Math Mid-term (50 marks)</h2>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-white">
              <option>Grade 8-A – Math Mid-term</option>
              <option>Grade 7-B – Math Mid-term</option>
              <option>Grade 9-A – Math Mid-term</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-500 uppercase">Marks (/ 50)</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-500 uppercase">Grade</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody>
                {STUDENT_PERFORMANCE.map((s) => (
                  <tr key={s.name} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="px-4 py-3 font-medium text-text-900">{s.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input defaultValue={s.marks} type="number" min={0} max={50} className="w-16 border border-border rounded-md px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRADE_COLORS[s.grade] ?? "bg-gray-100 text-gray-600"}`}>{s.grade}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-text-700">{Math.round((s.marks / s.max) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-50">Save Draft</button>
            <button className="px-5 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">Publish Results</button>
          </div>
        </div>
      )}

      {/* Messages tab */}
      {activeTab === "messages" && (
        <div className="space-y-3">
          {PARENT_MESSAGES.map((m) => (
            <button key={m.id} onClick={() => setMsgOpen(m)} className="w-full text-left bg-white rounded-2xl border border-border p-5 hover:border-spira-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold shrink-0">{m.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-900">{m.parent}</p>
                    {m.unread && <span className="w-2 h-2 bg-spira-600 rounded-full" />}
                  </div>
                  <p className="text-xs text-text-400">Parent of {m.child} · {m.time}</p>
                  <p className="text-sm text-text-600 mt-1 line-clamp-2">{m.message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Exams tab */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-900">Upcoming Exams</h2>
            <Link href="/exams/new" className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800 transition-colors">+ Create Exam</Link>
          </div>
          <div className="space-y-3">
            {EXAM_SCHEDULE.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center shrink-0">
                  <p className="text-lg font-black text-red-700">{new Date(e.date).getDate()}</p>
                  <p className="text-[10px] text-red-400 uppercase">{new Date(e.date).toLocaleString("en-IN", { month: "short", timeZone: "UTC" })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-900">{e.title}</p>
                  <p className="text-sm text-text-500">{e.class} · Max {e.maxMarks} marks</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-surface-50">Edit</button>
                  <button onClick={() => setActiveTab("marks")} className="px-3 py-1.5 text-xs bg-spira-50 border border-spira-200 text-spira-700 rounded-lg hover:bg-spira-100">Enter Marks</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-900 mb-4">Student Performance Overview</h2>
            <div className="space-y-3">
              {STUDENT_PERFORMANCE.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-xs font-bold shrink-0">{s.name.split(" ").map(n => n[0]).join("")}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-text-900">{s.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${GRADE_COLORS[s.grade] ?? "bg-gray-100 text-gray-600"}`}>{s.grade}</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(s.marks / s.max) * 100}%`, backgroundColor: PERF_BAR_COLOR(s.marks, s.max) }} />
                    </div>
                  </div>
                  <span className="text-xs text-text-400 w-12 text-right shrink-0">{s.marks}/{s.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message modal */}
      {msgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setMsgOpen(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold">{msgOpen.avatar}</div>
              <div>
                <p className="font-semibold text-text-900">{msgOpen.parent}</p>
                <p className="text-xs text-text-400">Parent of {"child" in msgOpen ? msgOpen.child : ""} · {msgOpen.time}</p>
              </div>
            </div>
            <p className="text-text-700 text-sm leading-relaxed bg-surface-50 rounded-xl p-4">{msgOpen.message}</p>
            <div className="mt-4 flex gap-2">
              <input placeholder="Reply to parent…" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
              <button className="px-4 py-2 bg-spira-700 text-white text-sm rounded-lg hover:bg-spira-800">Send</button>
            </div>
            <button onClick={() => setMsgOpen(null)} className="mt-3 w-full text-xs text-text-400 hover:text-text-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
