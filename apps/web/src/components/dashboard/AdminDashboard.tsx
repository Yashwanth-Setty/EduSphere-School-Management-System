"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { AuthUser, Role } from "@spira/types";
import { canCreate } from "@/lib/permissions";

// ── Static mock data ────────────────────────────────────────────────────────

const RECENT_ADMISSIONS = [
  { id: "1", name: "Riya Sharma",    class: "Grade 6-A", date: "2026-06-15", status: "enrolled",  admNo: "2026-0061" },
  { id: "2", name: "Dev Malhotra",   class: "Grade 8-B", date: "2026-06-12", status: "enrolled",  admNo: "2026-0060" },
  { id: "3", name: "Ananya Bose",    class: "Grade 7-A", date: "2026-06-10", status: "pending",   admNo: "2026-0059" },
  { id: "4", name: "Samir Khan",     class: "Grade 9-B", date: "2026-06-08", status: "enrolled",  admNo: "2026-0058" },
  { id: "5", name: "Pooja Iyer",     class: "Grade 5-A", date: "2026-06-05", status: "withdrawn", admNo: "2026-0057" },
];

const STAFF_LIST = [
  { id: "1", name: "Arjun Sharma",   role: "Teacher",   dept: "Mathematics", status: "active",  joinDate: "2022-07-01" },
  { id: "2", name: "Priya Nair",     role: "Teacher",   dept: "Science",     status: "active",  joinDate: "2021-06-15" },
  { id: "3", name: "Rachel Thomas",  role: "Teacher",   dept: "English",     status: "active",  joinDate: "2023-08-01" },
  { id: "4", name: "Suresh Babu",    role: "Principal", dept: "Admin",       status: "active",  joinDate: "2018-06-01" },
  { id: "5", name: "Meera Krishnan", role: "Counselor", dept: "Welfare",     status: "on_leave",joinDate: "2020-03-10" },
];

const FEE_COLLECTION = [
  { month: "Jan", collected: 420000, target: 500000 },
  { month: "Feb", collected: 480000, target: 500000 },
  { month: "Mar", collected: 510000, target: 500000 },
  { month: "Apr", collected: 390000, target: 500000 },
  { month: "May", collected: 460000, target: 500000 },
  { month: "Jun", collected: 320000, target: 500000 },
];

const TRANSPORT_ROUTES = [
  { id: "1", name: "Route A – North Zone", vehicle: "MH-12 AB 1234", driver: "Raju Verma",   students: 24, status: "on_route" },
  { id: "2", name: "Route B – South Zone", vehicle: "MH-12 CD 5678", driver: "Vijay Kumar",  students: 18, status: "arrived"  },
  { id: "3", name: "Route C – East Zone",  vehicle: "MH-12 EF 9012", driver: "Ramesh Singh", students: 22, status: "on_route" },
];

const ANNOUNCEMENTS_RECENT = [
  { id: "1", title: "Annual Sports Day – 15 August 2026",          audience: "school",   date: "2026-06-18", channel: "events" },
  { id: "2", title: "Grade 8-A: Maths Extra Class on Saturday",     audience: "students", date: "2026-06-17", channel: "class"  },
  { id: "3", title: "Exam Schedule Released for Term 1 Finals",      audience: "school",   date: "2026-06-15", channel: "exams"  },
  { id: "4", title: "Parent-Teacher Meeting – 5 July 2026",          audience: "parents",  date: "2026-06-14", channel: "events" },
];

const ATTENDANCE_WEEK = [
  { day: "Mon", present: 245, total: 280 },
  { day: "Tue", present: 262, total: 280 },
  { day: "Wed", present: 270, total: 280 },
  { day: "Thu", present: 255, total: 280 },
  { day: "Fri", present: 248, total: 280 },
];

const LIBRARY_BOOKS = [
  { id: "1", title: "Mathematics Grade 8 NCERT", category: "Textbook", available: 12, total: 20, status: "available" },
  { id: "2", title: "Wings of Fire – APJ Kalam", category: "Biography",available: 3,  total: 8,  status: "low"       },
  { id: "3", title: "Science Grade 8 NCERT",     category: "Textbook", available: 0,  total: 20, status: "out"       },
  { id: "4", title: "Rich Dad Poor Dad",          category: "Finance",  available: 5,  total: 6,  status: "available" },
];

const HOSTEL_ROOMS = [
  { room: "101", capacity: 4, occupied: 4, students: ["Ravi K.", "Amit S.", "Dev M.", "Nikhil P."], status: "full"      },
  { room: "102", capacity: 4, occupied: 2, students: ["Sara T.", "Priya K."],                         status: "available" },
  { room: "103", capacity: 4, occupied: 3, students: ["Aryan G.", "Rohan M.", "Sam T."],               status: "available" },
  { room: "104", capacity: 4, occupied: 4, students: ["Kiran L.", "Jay P.", "Sunil V.", "Rajesh D."], status: "full"      },
];

const ADMISSION_STATUS: Record<string, string> = {
  enrolled:  "bg-green-100 text-green-700",
  pending:   "bg-yellow-100 text-yellow-700",
  withdrawn: "bg-red-100 text-red-700",
};

const STAFF_STATUS: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  on_leave: "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-600",
};

const TRANSPORT_STATUS: Record<string, string> = {
  on_route: "bg-blue-100 text-blue-700",
  arrived:  "bg-green-100 text-green-700",
  delayed:  "bg-red-100 text-red-700",
};

const LIBRARY_STATUS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  low:       "bg-yellow-100 text-yellow-700",
  out:       "bg-red-100 text-red-700",
};

const HOSTEL_STATUS: Record<string, string> = {
  full:      "bg-red-100 text-red-700",
  available: "bg-green-100 text-green-700",
};

const ROLE_TITLES: Partial<Record<Role, string>> = {
  [Role.PRINCIPAL]:  "Principal Dashboard",
  [Role.ACCOUNTANT]: "Finance Dashboard",
  [Role.COUNSELOR]:  "Counselor Dashboard",
};

interface Overview { totalStudents: number; presentToday: number; pendingFees: number; activeAnnouncements: number; totalStaff: number; totalCourses: number }

// ── Main component ──────────────────────────────────────────────────────────

export function AdminDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "staff" | "fees" | "transport" | "library" | "hostel" | "reports">("overview");
  const [studentModal, setStudentModal] = useState<typeof RECENT_ADMISSIONS[0] | null>(null);
  const [staffModal, setStaffModal] = useState<typeof STAFF_LIST[0] | null>(null);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user?.roles ?? []) as Role[];
  const primaryRole = roles[0] ?? Role.ADMIN;
  const dashboardTitle = ROLE_TITLES[primaryRole] ?? "Admin Dashboard";

  const { data } = useSWR<Overview>(
    mounted && !!getAccessToken() ? "/analytics/overview" : null,
    (url: string) => apiClient.get<Overview>(url),
  );

  const attendanceRate = data && data.totalStudents > 0
    ? Math.round((data.presentToday / data.totalStudents) * 100)
    : 89;

  const totalFeeCollected = FEE_COLLECTION.reduce((s, m) => s + m.collected, 0);
  const totalFeeTarget = FEE_COLLECTION.reduce((s, m) => s + m.target, 0);
  const feeCollectionPct = Math.round((totalFeeCollected / totalFeeTarget) * 100);

  const TABS = [
    { key: "overview",   label: "Overview"   },
    { key: "students",   label: "Students"   },
    { key: "staff",      label: "Staff"      },
    { key: "fees",       label: "Fees"       },
    { key: "transport",  label: "Transport"  },
    { key: "library",    label: "Library"    },
    { key: "hostel",     label: "Hostel"     },
    { key: "reports",    label: "Reports"    },
  ] as const;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">{dashboardTitle}</h1>
          <p className="text-text-500 text-sm mt-1">Welcome back, <span className="font-medium text-text-700">{user.displayName}</span></p>
        </div>
        <div className="flex gap-2">
          <Link href="/announcements/new" className="px-3 py-2 text-sm border border-border rounded-lg bg-white hover:bg-surface-50">📢 Announce</Link>
          <Link href="/students" className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ Add Student</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/students" className="bg-gradient-to-br from-spira-600 to-spira-800 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-spira-200 text-xs font-medium uppercase tracking-wide mb-1">Total Students</p>
          <p className="text-3xl font-bold">{data?.totalStudents ?? 284}</p>
          <p className="text-spira-200 text-xs mt-1">enrolled</p>
        </Link>
        <Link href="/attendance" className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-green-100 text-xs font-medium uppercase tracking-wide mb-1">Present Today</p>
          <p className="text-3xl font-bold">{data?.presentToday ?? 253}</p>
          <p className="text-green-100 text-xs mt-1">{attendanceRate}% attendance</p>
        </Link>
        <Link href="/fees" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-amber-100 text-xs font-medium uppercase tracking-wide mb-1">Pending Fees</p>
          <p className="text-3xl font-bold">{data?.pendingFees ?? 48}</p>
          <p className="text-amber-100 text-xs mt-1">invoices unpaid</p>
        </Link>
        <Link href="/staff" className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-purple-100 text-xs font-medium uppercase tracking-wide mb-1">Active Staff</p>
          <p className="text-3xl font-bold">{data?.totalStaff ?? 32}</p>
          <p className="text-purple-100 text-xs mt-1">teaching + admin</p>
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

      {/* OVERVIEW tab */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Attendance chart */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-900">Weekly Attendance</h2>
                <span className="text-xs text-text-400">This week</span>
              </div>
              <div className="flex items-end gap-3 h-28">
                {ATTENDANCE_WEEK.map((d) => {
                  const pct = d.present / d.total;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-text-900">{d.present}</span>
                      <div className="w-full flex items-end" style={{ height: 80 }}>
                        <div className="w-full rounded-t-md" style={{ height: `${pct * 100}%`, backgroundColor: pct >= 0.9 ? "#22c55e" : pct >= 0.8 ? "#6366f1" : "#f59e0b" }} />
                      </div>
                      <span className="text-xs text-text-400">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent admissions */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
                <h2 className="text-sm font-semibold text-text-900">Recent Admissions</h2>
                <Link href="/students" className="text-xs text-spira-700 hover:underline">View all →</Link>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Name</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500 hidden md:table-cell">Class</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500 hidden md:table-cell">Adm. No.</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Status</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ADMISSIONS.map((s) => (
                    <tr key={s.id} className="border-t border-surface-100 hover:bg-surface-50">
                      <td className="px-5 py-3 font-medium text-text-900">{s.name}</td>
                      <td className="px-5 py-3 text-text-500 hidden md:table-cell">{s.class}</td>
                      <td className="px-5 py-3 font-mono text-xs text-text-400 hidden md:table-cell">{s.admNo}</td>
                      <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ADMISSION_STATUS[s.status] ?? "bg-gray-100 text-gray-600"}`}>{s.status}</span></td>
                      <td className="px-5 py-3"><button onClick={() => setStudentModal(s)} className="text-xs text-spira-700 hover:underline">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Fee collection */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="text-sm font-semibold text-text-900 mb-1">Fee Collection</h2>
              <p className="text-xs text-text-400 mb-3">2025–26 Academic Year</p>
              <p className="text-3xl font-black text-text-900">₹{(totalFeeCollected / 100000).toFixed(1)}L</p>
              <p className="text-xs text-text-400 mb-2">of ₹{(totalFeeTarget / 100000).toFixed(1)}L target</p>
              <div className="bg-surface-100 rounded-full h-3 mb-1">
                <div className="bg-spira-600 rounded-full h-3 transition-all" style={{ width: `${feeCollectionPct}%` }} />
              </div>
              <p className="text-xs text-spira-700 font-medium">{feeCollectionPct}% collected</p>
              <div className="mt-3 space-y-1.5">
                {FEE_COLLECTION.map((m) => {
                  const pct = Math.round((m.collected / m.target) * 100);
                  return (
                    <div key={m.month} className="flex items-center gap-2">
                      <span className="text-xs text-text-400 w-8 shrink-0">{m.month}</span>
                      <div className="flex-1 bg-surface-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? "#22c55e" : pct >= 70 ? "#6366f1" : "#f59e0b" }} />
                      </div>
                      <span className="text-xs text-text-500 w-8 text-right shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Transport quick view */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">🚌 Transport</h2>
                <Link href="/transport" className="text-xs text-spira-700 hover:underline">All →</Link>
              </div>
              <div className="space-y-2">
                {TRANSPORT_ROUTES.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-surface-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-900 truncate">{r.name}</p>
                      <p className="text-[11px] text-text-400">{r.vehicle} · {r.students} students</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${TRANSPORT_STATUS[r.status] ?? ""}`}>
                      {r.status === "on_route" ? "On Route" : "Arrived"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent announcements */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">Announcements</h2>
                <Link href="/announcements" className="text-xs text-spira-700 hover:underline">All →</Link>
              </div>
              <div className="space-y-2">
                {ANNOUNCEMENTS_RECENT.map((a) => (
                  <Link key={a.id} href={`/announcements/${a.id}`} className="block p-2.5 rounded-lg hover:bg-surface-50 border border-surface-100">
                    <p className="text-xs font-medium text-text-900 truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-text-400">{a.date}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-100 text-text-500 rounded capitalize">{a.audience}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENTS tab */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-3">
              <input placeholder="Search students…" className="px-3 py-2 text-sm border border-border rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-spira-500" />
              <select className="px-3 py-2 text-sm border border-border rounded-lg bg-white">
                <option>All Classes</option>
                <option>Grade 6</option>
                <option>Grade 7</option>
                <option>Grade 8</option>
                <option>Grade 9</option>
              </select>
              <select className="px-3 py-2 text-sm border border-border rounded-lg bg-white">
                <option>All Status</option>
                <option>Enrolled</option>
                <option>Pending</option>
                <option>Withdrawn</option>
              </select>
            </div>
            <Link href="/students/new" className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ New Student</Link>
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Class</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Adm. No.</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {RECENT_ADMISSIONS.map((s) => (
                  <tr key={s.id} className="border-t border-surface-100 hover:bg-surface-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-xs font-bold shrink-0">{s.name.split(" ").map(n => n[0]).join("")}</div>
                        <span className="font-medium text-text-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-500 hidden md:table-cell">{s.class}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-400 hidden md:table-cell">{s.admNo}</td>
                    <td className="px-5 py-3 text-text-400 text-xs hidden md:table-cell">{s.date}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ADMISSION_STATUS[s.status] ?? ""}`}>{s.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setStudentModal(s)} className="text-xs text-spira-700 hover:underline">View</button>
                        <button className="text-xs text-text-400 hover:underline">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF tab */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <input placeholder="Search staff…" className="px-3 py-2 text-sm border border-border rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-spira-500" />
            <Link href="/staff/new" className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ Add Staff</Link>
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {STAFF_LIST.map((s) => (
                  <tr key={s.id} className="border-t border-surface-100 hover:bg-surface-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">{s.name.split(" ").map(n => n[0]).join("")}</div>
                        <span className="font-medium text-text-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-500">{s.role}</td>
                    <td className="px-5 py-3 text-text-400 hidden md:table-cell">{s.dept}</td>
                    <td className="px-5 py-3 text-text-400 text-xs hidden md:table-cell">{s.joinDate}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAFF_STATUS[s.status] ?? ""}`}>{s.status.replace("_", " ")}</span></td>
                    <td className="px-5 py-3">
                      <button onClick={() => setStaffModal(s)} className="text-xs text-spira-700 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FEES tab */}
      {activeTab === "fees" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Total Collected", value: `₹${(totalFeeCollected / 100000).toFixed(1)}L`, sub: `${feeCollectionPct}% of target`, color: "from-green-500 to-green-700" },
              { label: "Pending Amount",  value: "₹4.8L", sub: "from 48 invoices",               color: "from-red-500 to-red-700" },
              { label: "This Month",      value: "₹3.2L", sub: "64% collected",                    color: "from-blue-500 to-blue-700" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                <p className="text-white/70 text-xs uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-900 mb-4">Monthly Fee Collection</h2>
            <div className="flex items-end gap-3 h-32">
              {FEE_COLLECTION.map((m) => {
                const pct = m.collected / m.target;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-text-700">₹{(m.collected / 100000).toFixed(1)}L</span>
                    <div className="w-full flex items-end" style={{ height: 100 }}>
                      <div className="w-full rounded-t-md" style={{ height: `${pct * 100}%`, backgroundColor: pct >= 0.9 ? "#22c55e" : pct >= 0.7 ? "#6366f1" : "#f59e0b" }} />
                    </div>
                    <span className="text-[10px] text-text-400">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Link href="/fees" className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-surface-50">View All Invoices</Link>
            <Link href="/fees/new" className="px-4 py-2 bg-spira-700 text-white text-sm rounded-lg hover:bg-spira-800">Generate Invoice</Link>
          </div>
        </div>
      )}

      {/* TRANSPORT tab */}
      {activeTab === "transport" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Total Routes", value: "3", sub: "active", color: "from-blue-500 to-blue-700" },
              { label: "Students on Bus", value: "64", sub: "today", color: "from-spira-600 to-spira-800" },
              { label: "On Route Now", value: "2", sub: "routes live", color: "from-green-500 to-green-700" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                <p className="text-white/70 text-xs uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <h2 className="text-sm font-semibold text-text-900">All Routes</h2>
              <Link href="/transport" className="text-xs text-spira-700 hover:underline">Manage →</Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Route</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500 hidden md:table-cell">Vehicle</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500 hidden md:table-cell">Driver</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Students</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {TRANSPORT_ROUTES.map((r) => (
                  <tr key={r.id} className="border-t border-surface-100 hover:bg-surface-50">
                    <td className="px-5 py-3 font-medium text-text-900">{r.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-400 hidden md:table-cell">{r.vehicle}</td>
                    <td className="px-5 py-3 text-text-500 hidden md:table-cell">{r.driver}</td>
                    <td className="px-5 py-3 text-text-700">{r.students}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRANSPORT_STATUS[r.status] ?? ""}`}>{r.status === "on_route" ? "On Route" : "Arrived"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIBRARY tab */}
      {activeTab === "library" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-900">Library Catalog</h2>
              <p className="text-xs text-text-400 mt-0.5">Total: 54 books · 4 categories</p>
            </div>
            <button className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ Add Book</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {LIBRARY_BOOKS.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-text-900">{b.title}</p>
                    <p className="text-xs text-text-400 mt-0.5">{b.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${LIBRARY_STATUS[b.status] ?? ""}`}>{b.status}</span>
                </div>
                <div className="mt-3 bg-surface-100 rounded-full h-2">
                  <div className="rounded-full h-2" style={{ width: `${(b.available / b.total) * 100}%`, backgroundColor: b.available === 0 ? "#ef4444" : b.available <= 3 ? "#f59e0b" : "#22c55e" }} />
                </div>
                <p className="text-xs text-text-400 mt-1">{b.available} of {b.total} copies available</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOSTEL tab */}
      {activeTab === "hostel" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Total Rooms",     value: "4",  sub: "in hostel",       color: "from-spira-600 to-spira-800" },
              { label: "Occupied",        value: "13", sub: "of 16 beds",      color: "from-amber-500 to-orange-600" },
              { label: "Available Beds",  value: "3",  sub: "vacant",          color: "from-green-500 to-green-700" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                <p className="text-white/70 text-xs uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {HOSTEL_ROOMS.map((r) => (
              <div key={r.room} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-text-900">Room {r.room}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${HOSTEL_STATUS[r.status] ?? ""}`}>{r.status}</span>
                </div>
                <p className="text-xs text-text-400 mb-2">{r.occupied}/{r.capacity} beds occupied</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.students.map((s) => (
                    <span key={s} className="text-xs bg-surface-100 text-text-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {r.occupied < r.capacity && (
                    <span className="text-xs border-2 border-dashed border-surface-200 text-text-300 px-2 py-0.5 rounded-full">+ {r.capacity - r.occupied} empty</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS tab */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Attendance Report",      desc: "Daily, weekly, monthly attendance by class",  icon: "📋", href: "/attendance" },
              { title: "Fee Collection Report",  desc: "Invoice-wise and month-wise fee analytics",    icon: "💰", href: "/fees" },
              { title: "Exam Results Report",    desc: "Subject-wise marks and grade distribution",    icon: "📊", href: "/exams" },
              { title: "Student Progress",       desc: "Individual student academic performance",       icon: "🎓", href: "/students" },
              { title: "Transport Report",       desc: "Route usage, driver performance, fuel logs",   icon: "🚌", href: "/transport" },
              { title: "Analytics Dashboard",   desc: "School-wide KPIs and trend analysis",          icon: "📈", href: "/analytics" },
            ].map((r) => (
              <Link key={r.title} href={r.href} className="bg-white rounded-2xl border border-border p-5 hover:border-spira-400 hover:shadow-md transition-all group">
                <div className="text-3xl mb-3">{r.icon}</div>
                <p className="font-semibold text-text-900 group-hover:text-spira-700 transition-colors">{r.title}</p>
                <p className="text-xs text-text-400 mt-1 leading-relaxed">{r.desc}</p>
                <p className="text-xs text-spira-700 mt-3 font-medium">View Report →</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Student detail modal */}
      {studentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setStudentModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-lg font-bold">{studentModal.name.split(" ").map(n => n[0]).join("")}</div>
              <div>
                <p className="font-semibold text-text-900 text-lg">{studentModal.name}</p>
                <p className="text-xs text-text-400">{studentModal.class}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Admission No.", studentModal.admNo],
                ["Admission Date", studentModal.date],
                ["Status", studentModal.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between p-2 rounded-lg bg-surface-50">
                  <span className="text-text-500">{k}</span>
                  <span className="font-medium text-text-900 capitalize">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-surface-50">Edit</button>
              <button className="flex-1 py-2 text-sm bg-spira-700 text-white rounded-lg hover:bg-spira-800">Full Profile</button>
            </div>
            <button onClick={() => setStudentModal(null)} className="mt-3 w-full text-xs text-text-400 hover:text-text-600">Close</button>
          </div>
        </div>
      )}

      {/* Staff detail modal */}
      {staffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setStaffModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold">{staffModal.name.split(" ").map(n => n[0]).join("")}</div>
              <div>
                <p className="font-semibold text-text-900 text-lg">{staffModal.name}</p>
                <p className="text-xs text-text-400">{staffModal.role} · {staffModal.dept}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Department", staffModal.dept],
                ["Joined", staffModal.joinDate],
                ["Status", staffModal.status.replace("_", " ")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between p-2 rounded-lg bg-surface-50">
                  <span className="text-text-500">{k}</span>
                  <span className="font-medium text-text-900 capitalize">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-surface-50">Message</button>
              <button className="flex-1 py-2 text-sm bg-spira-700 text-white rounded-lg hover:bg-spira-800">Full Profile</button>
            </div>
            <button onClick={() => setStaffModal(null)} className="mt-3 w-full text-xs text-text-400 hover:text-text-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
