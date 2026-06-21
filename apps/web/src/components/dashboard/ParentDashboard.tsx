"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { AuthUser } from "@/types";

// â”€â”€ Static mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CHILD = {
  name: "Ava Patel",
  class: "Grade 8 â€“ Section A",
  rollNo: "8A-12",
  admissionNo: "2022-0048",
  dob: "12 Mar 2012",
  bloodGroup: "B+",
  photo: "AP",
};

const SUBJECT_MARKS = [
  { subject: "Mathematics",   code: "MATH-8", marks: 44, max: 50, grade: "A",  color: "#6366f1" },
  { subject: "Science",       code: "SCI-8",  marks: 38, max: 50, grade: "B+", color: "#22c55e" },
  { subject: "English",       code: "ENG-8",  marks: 46, max: 50, grade: "A+", color: "#f59e0b" },
  { subject: "Social Studies",code: "SOC-8",  marks: 41, max: 50, grade: "A",  color: "#ec4899" },
];

const ATTENDANCE_WEEKS = [
  { week: "W1", present: 5, total: 5 },
  { week: "W2", present: 4, total: 5 },
  { week: "W3", present: 5, total: 5 },
  { week: "W4", present: 4, total: 5 },
  { week: "W5", present: 5, total: 5 },
  { week: "W6", present: 3, total: 5 },
];

const HOMEWORK = [
  { id: "1", subject: "Mathematics", title: "Chapter 5 â€“ Linear Equations Ex 5.3", due: "2026-06-28", status: "pending" },
  { id: "2", subject: "Science",     title: "Lab Report â€“ Refraction Experiment",   due: "2026-06-28", status: "submitted" },
  { id: "3", subject: "English",     title: "Essay â€“ My Favourite Book",             due: "2026-07-05", status: "pending" },
  { id: "4", subject: "Social Studies", title: "Map Work â€“ Rivers of India",        due: "2026-07-03", status: "completed" },
];

const SCHOOL_EVENTS = [
  { date: "2026-08-15", name: "Independence Day", type: "holiday" },
  { date: "2026-08-20", name: "Math Mid-term Exam", type: "exam" },
  { date: "2026-08-22", name: "Science Mid-term Exam", type: "exam" },
  { date: "2026-09-15", name: "Science Exhibition", type: "event" },
  { date: "2026-10-10", name: "Annual Sports Day", type: "event" },
  { date: "2026-11-01", name: "Term 1 Final Exams", type: "exam" },
];

const TEACHER_MESSAGES = [
  { id: "1", teacher: "Mr. Arjun Sharma", subject: "Mathematics", message: "Ava has shown excellent improvement in algebra. Keep encouraging her.", time: "2 days ago", avatar: "AS", unread: true },
  { id: "2", teacher: "Ms. Priya Nair", subject: "Science", message: "Please remind Ava to submit the lab report by Friday.", time: "4 days ago", avatar: "PN", unread: false },
  { id: "3", teacher: "Ms. Rachel Thomas", subject: "English", message: "Ava's essay writing is commendable. She should participate in the school quiz.", time: "1 week ago", avatar: "RT", unread: false },
];

const HW_STATUS: Record<string, { cls: string; label: string }> = {
  pending:   { cls: "bg-red-100 text-red-700",    label: "Pending" },
  submitted: { cls: "bg-yellow-100 text-yellow-700", label: "Submitted" },
  completed: { cls: "bg-green-100 text-green-700", label: "Graded" },
};

const EVENT_STYLE: Record<string, string> = {
  exam:    "bg-red-100 text-red-700",
  event:   "bg-blue-100 text-blue-700",
  holiday: "bg-green-100 text-green-700",
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  "A":  "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
};

const STATUS_STYLE: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  pending: "bg-red-100 text-red-700",
};

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Invoice { id: string; invoiceNo: string; amountDue: number; amountPaid: number; status: string; dueDate: string; feePlan: { name: string; currency: string }; studentProfile: { firstName: string; lastName: string } }
interface AttendanceRecord { status: string }
interface Announcement { id: string; title: string; body: string; publishedAt: string | null; channel: string }

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ParentDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "marks" | "homework" | "messages" | "calendar">("overview");
  const [msgOpen, setMsgOpen] = useState<typeof TEACHER_MESSAGES[0] | null>(null);
  useEffect(() => { setMounted(true); }, []);

  const ready = mounted && !!getAccessToken();

  const { data: invoices } = useSWR<{ data: Invoice[]; total: number }>(
    ready ? "/fees/my-invoices?page=1&pageSize=10" : null,
    (url: string) => apiClient.get<{ data: Invoice[]; total: number }>(url),
  );

  const { data: attendanceRecords } = useSWR<{ data: AttendanceRecord[] }>(
    ready ? "/attendance/my-records?page=1&pageSize=30" : null,
    (url: string) => apiClient.get<{ data: AttendanceRecord[] }>(url),
  );

  const { data: announcements } = useSWR<{ data: Announcement[] }>(
    ready ? "/announcements?page=1&pageSize=5" : null,
    (url: string) => apiClient.get<{ data: Announcement[] }>(url),
  );

  const pendingInvoices = (invoices?.data ?? []).filter((i) => i.status !== "paid");
  const allAttendance = attendanceRecords?.data ?? [];
  const presentCount = allAttendance.filter((r) => r.status === "present").length;
  const attendancePct = allAttendance.length > 0 ? Math.round((presentCount / allAttendance.length) * 100) : 90;
  const totalMarks = SUBJECT_MARKS.reduce((s, r) => s + r.marks, 0);
  const maxMarks = SUBJECT_MARKS.reduce((s, r) => s + r.max, 0);

  const TABS = [
    { key: "overview",  label: "Overview"  },
    { key: "marks",     label: "Marks"     },
    { key: "homework",  label: "Homework"  },
    { key: "messages",  label: "Messages"  },
    { key: "calendar",  label: "Calendar"  },
  ] as const;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-spira-600 to-spira-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {CHILD.photo}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-900">Parent Dashboard</h1>
          <p className="text-text-500 text-sm">Welcome back, <span className="font-medium text-text-700">{user.displayName}</span></p>
        </div>
      </div>

      {/* Child profile card */}
      <div className="bg-gradient-to-r from-spira-700 to-spira-900 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-spira-300 text-xs font-semibold uppercase tracking-wider mb-2">My Child</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">{CHILD.photo}</div>
          <div className="flex-1">
            <p className="text-xl font-bold">{CHILD.name}</p>
            <p className="text-spira-200 text-sm">{CHILD.class} Â· Roll No. {CHILD.rollNo}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-right">
            <span className="text-spira-300">Admission No</span><span className="font-medium">{CHILD.admissionNo}</span>
            <span className="text-spira-300">DOB</span><span className="font-medium">{CHILD.dob}</span>
            <span className="text-spira-300">Blood Group</span><span className="font-medium">{CHILD.bloodGroup}</span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/attendance" className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-green-100 text-xs font-medium uppercase tracking-wide mb-1">Attendance</p>
          <p className="text-3xl font-bold">{attendancePct}%</p>
          <p className="text-green-100 text-xs mt-1">last 30 days</p>
        </Link>
        <Link href="/exams" className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-indigo-100 text-xs font-medium uppercase tracking-wide mb-1">Overall Score</p>
          <p className="text-3xl font-bold">{Math.round((totalMarks / maxMarks) * 100)}%</p>
          <p className="text-indigo-100 text-xs mt-1">{totalMarks}/{maxMarks} marks</p>
        </Link>
        <Link href="/fees" className={`rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all ${pendingInvoices.length > 0 ? "bg-gradient-to-br from-red-500 to-red-700" : "bg-gradient-to-br from-emerald-500 to-emerald-700"}`}>
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">Pending Fees</p>
          <p className="text-3xl font-bold">{pendingInvoices.length}</p>
          <p className="text-white/70 text-xs mt-1">{pendingInvoices.length > 0 ? "unpaid" : "all clear"}</p>
        </Link>
        <Link href="/assignments" className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-orange-100 text-xs font-medium uppercase tracking-wide mb-1">Homework Due</p>
          <p className="text-3xl font-bold">{HOMEWORK.filter(h => h.status === "pending").length}</p>
          <p className="text-orange-100 text-xs mt-1">pending tasks</p>
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

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Attendance chart */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-900">Weekly Attendance</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${attendancePct >= 85 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{attendancePct}% overall</span>
              </div>
              <MiniBarChart weeks={ATTENDANCE_WEEKS} />
              <div className="flex justify-between mt-2">
                {ATTENDANCE_WEEKS.map((w) => <span key={w.week} className="text-[10px] text-text-400 flex-1 text-center">{w.week}</span>)}
              </div>
            </div>

            {/* Recent homework */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">Homework & Assignments</h2>
                <Link href="/assignments" className="text-xs text-spira-700 hover:underline">View all â†’</Link>
              </div>
              <div className="space-y-2">
                {HOMEWORK.map((hw) => (
                  <div key={hw.id} className="flex items-center gap-3 p-3 rounded-xl border border-surface-100 hover:border-surface-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-900 truncate">{hw.title}</p>
                      <p className="text-xs text-text-500 mt-0.5">{hw.subject} Â· Due {new Date(hw.due).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" })}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${HW_STATUS[hw.status].cls}`}>{HW_STATUS[hw.status].label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Transport */}
            <Link href="/transport" className="block bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 text-white hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">ðŸšŒ School Bus</p>
                <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">On Route</span>
              </div>
              <p className="text-blue-100 text-xs">Route A â€“ North Zone</p>
              <p className="text-blue-200 text-xs mt-0.5">Sunrise Apartments Â· ETA 07:30</p>
              <p className="text-blue-300 text-xs mt-1">Driver: Raju Verma Â· MH-12 AB 1234</p>
            </Link>

            {/* Announcements */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">Notices</h2>
                <Link href="/announcements" className="text-xs text-spira-700 hover:underline">All â†’</Link>
              </div>
              <div className="space-y-2">
                {((announcements?.data ?? []).slice(0, 4) as Announcement[]).map((ann) => (
                  <Link key={ann.id} href={`/announcements/${ann.id}`} className="block p-2.5 rounded-lg hover:bg-surface-50 border border-surface-100">
                    <p className="text-sm font-medium text-text-900 truncate">{ann.title}</p>
                    <p className="text-xs text-text-400 mt-0.5">{ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString("en-IN", { timeZone: "UTC" }) : ""}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Teacher messages preview */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">Messages</h2>
                <button onClick={() => setActiveTab("messages")} className="text-xs text-spira-700 hover:underline">View all â†’</button>
              </div>
              <div className="space-y-2">
                {TEACHER_MESSAGES.slice(0, 2).map((m) => (
                  <button key={m.id} onClick={() => setMsgOpen(m)} className="w-full text-left p-2.5 rounded-lg hover:bg-surface-50 border border-surface-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-[10px] font-bold shrink-0">{m.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-900 truncate">{m.teacher}</p>
                        <p className="text-xs text-text-500 truncate">{m.message}</p>
                      </div>
                      {m.unread && <span className="w-2 h-2 bg-spira-600 rounded-full shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "marks" && (
        <div className="space-y-5">
          {/* Overall score card */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Term 1 Performance</p>
                <p className="text-4xl font-black mt-1">{totalMarks}<span className="text-2xl text-indigo-200">/{maxMarks}</span></p>
                <p className="text-indigo-100 text-sm mt-1">Aggregate across 4 subjects</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black">{Math.round((totalMarks / maxMarks) * 100)}%</p>
                <p className="text-indigo-200 text-sm">Grade: A</p>
              </div>
            </div>
            <div className="mt-4 bg-indigo-900/40 rounded-full h-3">
              <div className="bg-white rounded-full h-3" style={{ width: `${Math.round((totalMarks / maxMarks) * 100)}%` }} />
            </div>
          </div>

          {/* Subject breakdown */}
          <div className="grid sm:grid-cols-2 gap-4">
            {SUBJECT_MARKS.map((s) => (
              <div key={s.code} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-text-900">{s.subject}</p>
                    <p className="text-xs text-text-400">{s.code}</p>
                  </div>
                  <span className={`text-sm px-2.5 py-1 rounded-full font-bold ${GRADE_COLORS[s.grade] ?? "bg-gray-100 text-gray-600"}`}>{s.grade}</span>
                </div>
                <p className="text-3xl font-black" style={{ color: s.color }}>{s.marks}<span className="text-base text-text-400">/{s.max}</span></p>
                <div className="mt-2 bg-surface-100 rounded-full h-2">
                  <div className="rounded-full h-2" style={{ width: `${(s.marks / s.max) * 100}%`, backgroundColor: s.color }} />
                </div>
                <p className="text-xs text-text-400 mt-1">{Math.round((s.marks / s.max) * 100)}% score</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">ðŸ’¡</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Teacher's Note</p>
              <p className="text-sm text-amber-700 mt-0.5">Ava is performing well overall. Science needs a bit of extra attention before mid-terms. Her English writing skills are exceptional.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "homework" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {["All", "Pending", "Submitted", "Completed"].map((f) => (
              <span key={f} className="px-3 py-1.5 text-xs rounded-full border border-border text-text-600 bg-white cursor-pointer hover:bg-surface-50">{f}</span>
            ))}
          </div>
          <div className="space-y-3">
            {HOMEWORK.map((hw) => (
              <div key={hw.id} className="bg-white rounded-2xl border border-border p-5 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-text-900">{hw.title}</p>
                  <p className="text-sm text-text-500 mt-0.5">{hw.subject}</p>
                  <p className="text-xs text-text-400 mt-1">Due: {new Date(hw.due).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "long" })}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${HW_STATUS[hw.status].cls}`}>{HW_STATUS[hw.status].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="space-y-3">
          {TEACHER_MESSAGES.map((m) => (
            <button key={m.id} onClick={() => setMsgOpen(m)} className="w-full text-left bg-white rounded-2xl border border-border p-5 hover:border-spira-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-sm font-bold shrink-0">{m.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-900">{m.teacher}</p>
                    {m.unread && <span className="w-2 h-2 bg-spira-600 rounded-full" />}
                  </div>
                  <p className="text-xs text-text-400">{m.subject} Teacher Â· {m.time}</p>
                  <p className="text-sm text-text-600 mt-1 line-clamp-2">{m.message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide">Upcoming School Events</h2>
          {SCHOOL_EVENTS.filter(e => new Date(e.date) >= new Date()).map((ev, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-50 border border-surface-100 flex flex-col items-center justify-center shrink-0">
                <p className="text-lg font-black text-text-900">{new Date(ev.date).getDate()}</p>
                <p className="text-[10px] text-text-400 uppercase">{new Date(ev.date).toLocaleString("en-IN", { month: "short", timeZone: "UTC" })}</p>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-900">{ev.name}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0 ${EVENT_STYLE[ev.type] ?? "bg-gray-100 text-gray-600"}`}>{ev.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message modal */}
      {msgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setMsgOpen(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-sm font-bold">{msgOpen.avatar}</div>
              <div>
                <p className="font-semibold text-text-900">{msgOpen.teacher}</p>
                <p className="text-xs text-text-400">{msgOpen.subject} Teacher Â· {msgOpen.time}</p>
              </div>
            </div>
            <p className="text-text-700 text-sm leading-relaxed">{msgOpen.message}</p>
            <div className="mt-4 flex gap-2">
              <input placeholder="Replyâ€¦" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
              <button className="px-4 py-2 bg-spira-700 text-white text-sm rounded-lg hover:bg-spira-800">Send</button>
            </div>
            <button onClick={() => setMsgOpen(null)} className="mt-3 w-full text-xs text-text-400 hover:text-text-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Mini chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MiniBarChart({ weeks }: { weeks: typeof ATTENDANCE_WEEKS }) {
  const max = Math.max(...weeks.map(w => w.total));
  return (
    <div className="flex items-end gap-2 h-20">
      {weeks.map((w) => {
        const pct = w.present / w.total;
        return (
          <div key={w.week} className="flex-1 flex items-end h-full">
            <div className="w-full rounded-t-md" style={{ height: `${pct * 100}%`, backgroundColor: pct >= 0.8 ? "#22c55e" : pct >= 0.6 ? "#f59e0b" : "#ef4444" }} />
          </div>
        );
      })}
    </div>
  );
}
