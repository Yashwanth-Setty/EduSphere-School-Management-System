"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { AuthUser, Role } from "@/types";

// â”€â”€ School-wide mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RECENT_ADMISSIONS = [
  { id: "1",  name: "Riya Sharma",      class: "Grade 6-A",  date: "2026-06-15", status: "enrolled",  admNo: "2026-0061" },
  { id: "2",  name: "Dev Malhotra",     class: "Grade 8-B",  date: "2026-06-12", status: "enrolled",  admNo: "2026-0060" },
  { id: "3",  name: "Ananya Bose",      class: "Grade 7-A",  date: "2026-06-10", status: "pending",   admNo: "2026-0059" },
  { id: "4",  name: "Samir Khan",       class: "Grade 9-B",  date: "2026-06-08", status: "enrolled",  admNo: "2026-0058" },
  { id: "5",  name: "Pooja Iyer",       class: "Grade 5-A",  date: "2026-06-05", status: "withdrawn", admNo: "2026-0057" },
  { id: "6",  name: "Aryan Gupta",      class: "Grade 11-A", date: "2026-06-03", status: "enrolled",  admNo: "2026-0056" },
  { id: "7",  name: "Shreya Pandey",    class: "Grade 3-B",  date: "2026-06-01", status: "enrolled",  admNo: "2026-0055" },
];

const ALL_STUDENTS_SAMPLE = [
  { id: "s1",  name: "Aarav Singh",      grade: "Grade 1-A",  section: "A", gender: "Male",   status: "enrolled",  admNo: "2026-0001" },
  { id: "s2",  name: "Priya Reddy",      grade: "Grade 2-B",  section: "B", gender: "Female", status: "enrolled",  admNo: "2025-0042" },
  { id: "s3",  name: "Aryan Gupta",      grade: "Grade 3-A",  section: "A", gender: "Male",   status: "enrolled",  admNo: "2025-0078" },
  { id: "s4",  name: "Meha Patel",       grade: "Grade 4-C",  section: "C", gender: "Female", status: "enrolled",  admNo: "2024-0033" },
  { id: "s5",  name: "Ravi Kumar",       grade: "Grade 5-B",  section: "B", gender: "Male",   status: "pending",   admNo: "2024-0091" },
  { id: "s6",  name: "Ananya Bose",      grade: "Grade 6-A",  section: "A", gender: "Female", status: "enrolled",  admNo: "2023-0015" },
  { id: "s7",  name: "Dev Malhotra",     grade: "Grade 7-B",  section: "B", gender: "Male",   status: "enrolled",  admNo: "2023-0062" },
  { id: "s8",  name: "Riya Sharma",      grade: "Grade 8-A",  section: "A", gender: "Female", status: "enrolled",  admNo: "2022-0009" },
  { id: "s9",  name: "Samir Khan",       grade: "Grade 9-C",  section: "C", gender: "Male",   status: "enrolled",  admNo: "2022-0047" },
  { id: "s10", name: "Pooja Iyer",       grade: "Grade 10-A", section: "A", gender: "Female", status: "withdrawn", admNo: "2021-0088" },
  { id: "s11", name: "Karan Mehta",      grade: "Grade 11-B", section: "B", gender: "Male",   status: "enrolled",  admNo: "2021-0031" },
  { id: "s12", name: "Nisha Verma",      grade: "Grade 12-A", section: "A", gender: "Female", status: "enrolled",  admNo: "2020-0007" },
];

const STAFF_LIST = [
  { id: "1",  name: "Dr. Suresh Babu",   role: "Principal",      dept: "Administration",  status: "active",   joinDate: "2015-06-01" },
  { id: "2",  name: "Mrs. Anitha Rao",   role: "Vice Principal", dept: "Administration",  status: "active",   joinDate: "2017-07-15" },
  { id: "3",  name: "Mr. Arjun Sharma",  role: "Teacher",        dept: "Mathematics",     status: "active",   joinDate: "2022-07-01" },
  { id: "4",  name: "Ms. Priya Nair",    role: "Teacher",        dept: "Science",         status: "active",   joinDate: "2021-06-15" },
  { id: "5",  name: "Ms. Rachel Thomas", role: "Teacher",        dept: "English",         status: "active",   joinDate: "2023-08-01" },
  { id: "6",  name: "Mr. Rajesh Pillai", role: "Accountant",     dept: "Finance",         status: "active",   joinDate: "2018-04-01" },
  { id: "7",  name: "Ms. Sunita Mehta",  role: "Librarian",      dept: "Library",         status: "active",   joinDate: "2019-06-15" },
  { id: "8",  name: "Dr. Meera Krishnan",role: "Counselor",      dept: "Student Welfare", status: "on_leave", joinDate: "2020-03-10" },
  { id: "9",  name: "Mr. Raju Verma",    role: "Driver",         dept: "Transport",       status: "active",   joinDate: "2020-01-10" },
  { id: "10", name: "Mrs. Lakshmi Devi", role: "Hostel Warden",  dept: "Hostel (Girls)",  status: "active",   joinDate: "2019-07-01" },
];

const FEE_COLLECTION = [
  { month: "Jan", collected: 18_40_000, target: 22_00_000 },
  { month: "Feb", collected: 20_10_000, target: 22_00_000 },
  { month: "Mar", collected: 21_50_000, target: 22_00_000 },
  { month: "Apr", collected: 15_80_000, target: 22_00_000 },
  { month: "May", collected: 19_20_000, target: 22_00_000 },
  { month: "Jun", collected: 12_70_000, target: 22_00_000 },
];

const GRADE_ATTENDANCE = [
  { grade: "Gr 1", present: 42, total: 45 },
  { grade: "Gr 2", present: 38, total: 42 },
  { grade: "Gr 3", present: 44, total: 48 },
  { grade: "Gr 4", present: 40, total: 44 },
  { grade: "Gr 5", present: 46, total: 50 },
  { grade: "Gr 6", present: 52, total: 56 },
  { grade: "Gr 7", present: 49, total: 54 },
  { grade: "Gr 8", present: 55, total: 60 },
  { grade: "Gr 9", present: 58, total: 62 },
  { grade: "Gr 10",present: 61, total: 66 },
  { grade: "Gr 11",present: 44, total: 48 },
  { grade: "Gr 12",present: 38, total: 42 },
];

const TRANSPORT_ROUTES = [
  { id: "1", name: "Route A â€“ North Zone", vehicle: "MH-12 AB 1234", driver: "Raju Verma",    students: 42, status: "on_route" },
  { id: "2", name: "Route B â€“ South Zone", vehicle: "MH-12 CD 5678", driver: "Vijay Kumar",   students: 38, status: "arrived"  },
  { id: "3", name: "Route C â€“ East Zone",  vehicle: "MH-12 EF 9012", driver: "Ramesh Singh",  students: 35, status: "on_route" },
  { id: "4", name: "Route D â€“ West Zone",  vehicle: "MH-12 GH 3456", driver: "Anthony Joseph",students: 28, status: "delayed"  },
  { id: "5", name: "Route E â€“ City Core",  vehicle: "MH-12 IJ 7890", driver: "Suresh Das",    students: 31, status: "arrived"  },
];

const ANNOUNCEMENTS_RECENT = [
  { id: "1", title: "Annual Sports Day â€“ 15 August 2026",              audience: "school",   date: "2026-06-18" },
  { id: "2", title: "Grade 10 & 12: Board Exam Schedule Released",      audience: "students", date: "2026-06-17" },
  { id: "3", title: "Term 1 Final Exams: 20â€“28 July 2026",              audience: "school",   date: "2026-06-15" },
  { id: "4", title: "Parent-Teacher Meeting â€“ 5 July 2026",             audience: "parents",  date: "2026-06-14" },
  { id: "5", title: "Fee Reminder: Q2 Due by 30 June 2026",             audience: "parents",  date: "2026-06-12" },
];

const LIBRARY_BOOKS = [
  { id: "1", title: "Mathematics Grade 8 NCERT",  category: "Textbook",  available: 12, total: 20, status: "available" },
  { id: "2", title: "Wings of Fire â€“ APJ Kalam",  category: "Biography", available: 3,  total: 8,  status: "low"       },
  { id: "3", title: "Science Grade 10 NCERT",     category: "Textbook",  available: 0,  total: 25, status: "out"       },
  { id: "4", title: "Rich Dad Poor Dad",           category: "Finance",   available: 5,  total: 6,  status: "available" },
  { id: "5", title: "History of India â€“ Class 12", category: "Textbook",  available: 8,  total: 15, status: "available" },
  { id: "6", title: "English Literature Grade 11", category: "Textbook",  available: 2,  total: 12, status: "low"       },
];

const HOSTEL_BLOCKS = [
  { block: "Block A (Boys)",  rooms: 20, totalBeds: 80, occupied: 72, warden: "Mr. Sunil Patel"   },
  { block: "Block B (Girls)", rooms: 18, totalBeds: 72, occupied: 65, warden: "Mrs. Lakshmi Devi" },
];

const HOSTEL_ROOMS = [
  { room: "A-101", block: "Boys", capacity: 4, occupied: 4, students: ["Ravi K.", "Amit S.", "Dev M.", "Nikhil P."], status: "full"      },
  { room: "A-102", block: "Boys", capacity: 4, occupied: 2, students: ["Aryan G.", "Rohan M."],                       status: "available" },
  { room: "B-101", block: "Girls",capacity: 4, occupied: 4, students: ["Sara T.", "Priya K.", "Ananya B.", "Meha P."],status: "full"      },
  { room: "B-102", block: "Girls",capacity: 4, occupied: 3, students: ["Kiran L.", "Jay P.", "Sunita V."],             status: "available" },
];

const EXAMS_UPCOMING = [
  { id: "1", exam: "Term 1 Finals",     grades: "All Grades",     startDate: "2026-07-20", endDate: "2026-07-28", status: "upcoming" },
  { id: "2", exam: "Unit Test 3",       grades: "Grade 6â€“10",     startDate: "2026-07-05", endDate: "2026-07-06", status: "upcoming" },
  { id: "3", exam: "Board Mock Exam",   grades: "Grade 10 & 12",  startDate: "2026-06-25", endDate: "2026-06-27", status: "ongoing"  },
  { id: "4", exam: "Unit Test 2",       grades: "Grade 1â€“5",      startDate: "2026-06-10", endDate: "2026-06-11", status: "completed"},
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

const EXAM_STATUS: Record<string, string> = {
  upcoming:  "bg-blue-100 text-blue-700",
  ongoing:   "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

const ROLE_TITLES: Partial<Record<Role, string>> = {
  [Role.PRINCIPAL]:  "Principal Dashboard",
  [Role.ACCOUNTANT]: "Finance Dashboard",
  [Role.COUNSELOR]:  "Counselor Dashboard",
};

interface Overview { totalStudents: number; presentToday: number; pendingFees: number; activeAnnouncements: number; totalStaff: number; totalCourses: number }

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AdminDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "staff" | "fees" | "attendance" | "exams" | "transport" | "library" | "hostel" | "communication" | "reports">("overview");
  const [studentModal, setStudentModal] = useState<typeof RECENT_ADMISSIONS[0] | null>(null);
  const [staffModal, setStaffModal] = useState<typeof STAFF_LIST[0] | null>(null);
  const [toast, setToast] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");

  useEffect(() => { setMounted(true); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const roles = (user?.roles ?? []) as Role[];
  const primaryRole = roles[0] ?? Role.ADMIN;
  const dashboardTitle = ROLE_TITLES[primaryRole] ?? "Admin Dashboard";

  const { data } = useSWR<Overview>(
    mounted && !!getAccessToken() ? "/analytics/overview" : null,
    (url: string) => apiClient.get<Overview>(url),
  );

  const totalStudents = data?.totalStudents ?? 1247;
  const presentToday  = data?.presentToday  ?? 1108;
  const totalStaff    = data?.totalStaff    ?? 22;
  const attendanceRate = Math.round((presentToday / totalStudents) * 100);

  const totalFeeCollected = FEE_COLLECTION.reduce((s, m) => s + m.collected, 0);
  const totalFeeTarget    = FEE_COLLECTION.reduce((s, m) => s + m.target, 0);
  const feeCollectionPct  = Math.round((totalFeeCollected / totalFeeTarget) * 100);

  const TABS = [
    { key: "overview",       label: "Overview"       },
    { key: "students",       label: "Students"       },
    { key: "staff",          label: "Staff"          },
    { key: "fees",           label: "Fees"           },
    { key: "attendance",     label: "Attendance"     },
    { key: "exams",          label: "Exams"          },
    { key: "transport",      label: "Transport"      },
    { key: "library",        label: "Library"        },
    { key: "hostel",         label: "Hostel"         },
    { key: "communication",  label: "Communication"  },
    { key: "reports",        label: "Reports"        },
  ] as const;

  const filteredStudents = gradeFilter === "All"
    ? ALL_STUDENTS_SAMPLE
    : ALL_STUDENTS_SAMPLE.filter((s) => s.grade.startsWith(gradeFilter));

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-text-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">{dashboardTitle}</h1>
          <p className="text-text-500 text-sm mt-1">Welcome back, <span className="font-medium text-text-700">{user.displayName}</span></p>
        </div>
        <div className="flex gap-2">
          <Link href="/announcements/new" className="px-3 py-2 text-sm border border-border rounded-lg bg-white hover:bg-surface-50">ðŸ“¢ Announce</Link>
          <Link href="/students" className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ Add Student</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/students" className="bg-gradient-to-br from-spira-600 to-spira-800 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-spira-200 text-xs font-medium uppercase tracking-wide mb-1">Total Students</p>
          <p className="text-3xl font-bold">{totalStudents.toLocaleString()}</p>
          <p className="text-spira-200 text-xs mt-1">Grades 1â€“12 Â· 36 sections</p>
        </Link>
        <Link href="/attendance" className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-green-100 text-xs font-medium uppercase tracking-wide mb-1">Present Today</p>
          <p className="text-3xl font-bold">{presentToday.toLocaleString()}</p>
          <p className="text-green-100 text-xs mt-1">{attendanceRate}% school-wide</p>
        </Link>
        <Link href="/fees" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-amber-100 text-xs font-medium uppercase tracking-wide mb-1">Pending Fees</p>
          <p className="text-3xl font-bold">{data?.pendingFees ?? 186}</p>
          <p className="text-amber-100 text-xs mt-1">invoices unpaid</p>
        </Link>
        <Link href="/staff" className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">
          <p className="text-purple-100 text-xs font-medium uppercase tracking-wide mb-1">Active Staff</p>
          <p className="text-3xl font-bold">{totalStaff}</p>
          <p className="text-purple-100 text-xs mt-1">teaching + admin + support</p>
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

      {/* â”€â”€ OVERVIEW â”€â”€ */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Grade-wise attendance bar chart */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-900">Grade-wise Attendance Today</h2>
                <span className="text-xs text-text-400">School-wide</span>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {GRADE_ATTENDANCE.map((d) => {
                  const pct = d.present / d.total;
                  return (
                    <div key={d.grade} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end" style={{ height: 80 }}>
                        <div className="w-full rounded-t-sm" style={{ height: `${pct * 100}%`, backgroundColor: pct >= 0.92 ? "#22c55e" : pct >= 0.82 ? "#6366f1" : "#f59e0b" }} />
                      </div>
                      <span className="text-[9px] text-text-400 whitespace-nowrap">{d.grade}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-xs text-text-400"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block"/>&gt;92%</span>
                <span className="flex items-center gap-1 text-xs text-text-400"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block"/>82â€“91%</span>
                <span className="flex items-center gap-1 text-xs text-text-400"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block"/>&lt;82%</span>
              </div>
            </div>

            {/* Recent admissions */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
                <h2 className="text-sm font-semibold text-text-900">Recent Admissions</h2>
                <Link href="/students" className="text-xs text-spira-700 hover:underline">View all â†’</Link>
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
                      <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ADMISSION_STATUS[s.status] ?? ""}`}>{s.status}</span></td>
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
              <p className="text-xs text-text-400 mb-3">2025â€“26 Academic Year</p>
              <p className="text-3xl font-black text-text-900">â‚¹{(totalFeeCollected / 10_00_000).toFixed(1)}Cr</p>
              <p className="text-xs text-text-400 mb-2">of â‚¹{(totalFeeTarget / 10_00_000).toFixed(1)}Cr target</p>
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

            {/* Transport */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">ðŸšŒ Transport</h2>
                <Link href="/transport" className="text-xs text-spira-700 hover:underline">All â†’</Link>
              </div>
              <div className="space-y-2">
                {TRANSPORT_ROUTES.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-surface-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-900 truncate">{r.name}</p>
                      <p className="text-[11px] text-text-400">{r.vehicle} Â· {r.students} students</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${TRANSPORT_STATUS[r.status] ?? ""}`}>
                      {r.status === "on_route" ? "On Route" : r.status === "arrived" ? "Arrived" : "Delayed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent announcements */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-900">Announcements</h2>
                <Link href="/announcements" className="text-xs text-spira-700 hover:underline">All â†’</Link>
              </div>
              <div className="space-y-2">
                {ANNOUNCEMENTS_RECENT.slice(0, 4).map((a) => (
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

      {/* â”€â”€ STUDENTS â”€â”€ */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-3 flex-wrap">
              <input placeholder="Search studentsâ€¦" className="px-3 py-2 text-sm border border-border rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-spira-500" />
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-lg bg-white">
                <option value="All">All Grades</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((g) => <option key={g} value={`Grade ${g}`}>Grade {g}</option>)}
              </select>
              <select className="px-3 py-2 text-sm border border-border rounded-lg bg-white">
                <option>All Sections</option>
                <option>Section A</option>
                <option>Section B</option>
                <option>Section C</option>
              </select>
              <select className="px-3 py-2 text-sm border border-border rounded-lg bg-white">
                <option>All Status</option>
                <option>Enrolled</option>
                <option>Pending</option>
                <option>Withdrawn</option>
              </select>
            </div>
            <button onClick={() => showToast("Add Student form coming soon")} className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ New Student</button>
          </div>
          <p className="text-xs text-text-400">Showing {filteredStudents.length} of {totalStudents.toLocaleString()} students (sample)</p>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Grade</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Adm. No.</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Gender</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="border-t border-surface-100 hover:bg-surface-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-xs font-bold shrink-0">{s.name.split(" ").map(n => n[0]).join("")}</div>
                        <span className="font-medium text-text-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-500 hidden md:table-cell">{s.grade}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-400 hidden md:table-cell">{s.admNo}</td>
                    <td className="px-5 py-3 text-text-400 capitalize hidden md:table-cell">{s.gender}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ADMISSION_STATUS[s.status] ?? ""}`}>{s.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => showToast(`Viewing ${s.name}`)} className="text-xs text-spira-700 hover:underline">View</button>
                        <button onClick={() => showToast(`Editing ${s.name}`)} className="text-xs text-text-400 hover:underline">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€ STAFF â”€â”€ */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <input placeholder="Search staffâ€¦" className="px-3 py-2 text-sm border border-border rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-spira-500" />
            <Link href="/staff" className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">Manage Staff â†’</Link>
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
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">{s.name.split(" ").map(n => n[0]).join("").slice(0,2)}</div>
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
          <p className="text-xs text-text-400">Showing 10 of {totalStaff} staff members. <Link href="/staff" className="text-spira-700 hover:underline">View all â†’</Link></p>
        </div>
      )}

      {/* â”€â”€ FEES â”€â”€ */}
      {activeTab === "fees" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Total Collected", value: `â‚¹${(totalFeeCollected / 10_00_000).toFixed(2)}Cr`, sub: `${feeCollectionPct}% of annual target`, color: "from-green-500 to-green-700" },
              { label: "Pending Amount",  value: "â‚¹28.4L",   sub: "from 186 unpaid invoices",                                                        color: "from-red-500 to-red-700"   },
              { label: "This Month",      value: "â‚¹12.7L",   sub: "57.7% of monthly target",                                                          color: "from-blue-500 to-blue-700" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                <p className="text-white/70 text-xs uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-900 mb-4">Monthly Fee Collection (2025â€“26)</h2>
            <div className="flex items-end gap-3 h-36">
              {FEE_COLLECTION.map((m) => {
                const pct = m.collected / m.target;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-text-700">â‚¹{(m.collected / 100000).toFixed(1)}L</span>
                    <div className="w-full flex items-end" style={{ height: 110 }}>
                      <div className="w-full rounded-t-md" style={{ height: `${pct * 100}%`, backgroundColor: pct >= 0.9 ? "#22c55e" : pct >= 0.7 ? "#6366f1" : "#f59e0b" }} />
                    </div>
                    <span className="text-[10px] text-text-400">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => showToast("Exporting fee reportâ€¦")} className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-surface-50">â†“ Export</button>
            <Link href="/fees" className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-surface-50">View All Invoices</Link>
            <button onClick={() => showToast("Generate Invoice form coming soon")} className="px-4 py-2 bg-spira-700 text-white text-sm rounded-lg hover:bg-spira-800">Generate Invoice</button>
          </div>
        </div>
      )}

      {/* â”€â”€ ATTENDANCE â”€â”€ */}
      {activeTab === "attendance" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: "Total Students", value: totalStudents.toLocaleString(), color: "from-spira-600 to-spira-800" },
              { label: "Present Today",  value: presentToday.toLocaleString(),  color: "from-green-500 to-green-700" },
              { label: "Absent Today",   value: (totalStudents - presentToday).toString(), color: "from-red-500 to-red-700" },
              { label: "Attendance Rate",value: `${attendanceRate}%`,            color: "from-blue-500 to-blue-700" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                <p className="text-white/70 text-xs uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-900 mb-4">Grade-wise Attendance Today</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Grade</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Total</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Present</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Absent</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500">Rate</th>
                    <th className="px-5 py-2.5 w-40">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {GRADE_ATTENDANCE.map((g) => {
                    const pct = Math.round((g.present / g.total) * 100);
                    return (
                      <tr key={g.grade} className="border-t border-surface-100 hover:bg-surface-50">
                        <td className="px-5 py-3 font-medium text-text-900">{g.grade}</td>
                        <td className="px-5 py-3 text-text-500">{g.total}</td>
                        <td className="px-5 py-3 text-green-700 font-medium">{g.present}</td>
                        <td className="px-5 py-3 text-red-600">{g.total - g.present}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pct >= 92 ? "bg-green-100 text-green-700" : pct >= 82 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{pct}%</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="bg-surface-100 rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 92 ? "#22c55e" : pct >= 82 ? "#6366f1" : "#f59e0b" }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/attendance" className="px-4 py-2 bg-spira-700 text-white text-sm rounded-lg hover:bg-spira-800">Full Attendance â†’</Link>
          </div>
        </div>
      )}

      {/* â”€â”€ EXAMS â”€â”€ */}
      {activeTab === "exams" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-900">Exam Schedule â€“ 2025â€“26</h2>
              <p className="text-xs text-text-400 mt-0.5">All grades and sections</p>
            </div>
            <button onClick={() => showToast("Create Exam form coming soon")} className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ Schedule Exam</button>
          </div>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Exam</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Grades</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Start</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">End</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {EXAMS_UPCOMING.map((e) => (
                  <tr key={e.id} className="border-t border-surface-100 hover:bg-surface-50">
                    <td className="px-5 py-3 font-medium text-text-900">{e.exam}</td>
                    <td className="px-5 py-3 text-text-500 hidden md:table-cell">{e.grades}</td>
                    <td className="px-5 py-3 text-text-400 text-xs hidden md:table-cell">{e.startDate}</td>
                    <td className="px-5 py-3 text-text-400 text-xs hidden md:table-cell">{e.endDate}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${EXAM_STATUS[e.status] ?? ""}`}>{e.status}</span></td>
                    <td className="px-5 py-3">
                      <button onClick={() => showToast(`Viewing ${e.exam}`)} className="text-xs text-spira-700 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Link href="/exams" className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-surface-50">View Full Exam Dashboard â†’</Link>
          </div>
        </div>
      )}

      {/* â”€â”€ TRANSPORT â”€â”€ */}
      {activeTab === "transport" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: "Total Routes",   value: "5",   sub: "active",       color: "from-blue-500 to-blue-700"   },
              { label: "Students on Bus",value: "174", sub: "today",        color: "from-spira-600 to-spira-800" },
              { label: "On Route Now",   value: "2",   sub: "routes live",  color: "from-green-500 to-green-700" },
              { label: "Delayed",        value: "1",   sub: "route",        color: "from-red-500 to-red-700"     },
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
              <Link href="/transport" className="text-xs text-spira-700 hover:underline">Manage â†’</Link>
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
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRANSPORT_STATUS[r.status] ?? ""}`}>{r.status === "on_route" ? "On Route" : r.status === "arrived" ? "Arrived" : "Delayed"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€ LIBRARY â”€â”€ */}
      {activeTab === "library" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Total Books",  value: "1,240", sub: "in catalog",         color: "from-teal-500 to-teal-700"   },
              { label: "Issued",       value: "318",   sub: "currently borrowed",  color: "from-amber-500 to-orange-600"},
              { label: "Overdue",      value: "24",    sub: "books overdue",       color: "from-red-500 to-red-700"     },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                <p className="text-white/70 text-xs uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-text-900">Book Catalog (sample)</h2>
            <button onClick={() => showToast("Add Book form coming soon")} className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ Add Book</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* â”€â”€ HOSTEL â”€â”€ */}
      {activeTab === "hostel" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {HOSTEL_BLOCKS.map((b) => {
              const vacant = b.totalBeds - b.occupied;
              const pct = Math.round((b.occupied / b.totalBeds) * 100);
              return (
                <div key={b.block} className="bg-white rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-text-900">{b.block}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pct >= 90 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{pct}% full</span>
                  </div>
                  <p className="text-xs text-text-400">Warden: <span className="font-medium text-text-700">{b.warden}</span></p>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-surface-50 rounded-xl p-3"><p className="text-xl font-bold text-text-900">{b.rooms}</p><p className="text-[10px] text-text-400">Rooms</p></div>
                    <div className="bg-surface-50 rounded-xl p-3"><p className="text-xl font-bold text-green-700">{b.occupied}</p><p className="text-[10px] text-text-400">Occupied</p></div>
                    <div className="bg-surface-50 rounded-xl p-3"><p className="text-xl font-bold text-blue-700">{vacant}</p><p className="text-[10px] text-text-400">Vacant</p></div>
                  </div>
                  <div className="mt-3 bg-surface-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-spira-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <h2 className="text-sm font-semibold text-text-900">Room Details (sample)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {HOSTEL_ROOMS.map((r) => (
              <div key={r.room} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-text-900">Room {r.room}</p>
                    <p className="text-xs text-text-400">{r.block} Block</p>
                  </div>
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

      {/* â”€â”€ COMMUNICATION â”€â”€ */}
      {activeTab === "communication" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-900">School Communications</h2>
              <p className="text-xs text-text-400 mt-0.5">Announcements, circulars, and notices</p>
            </div>
            <Link href="/announcements/new" className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">+ New Announcement</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Total Announcements", value: "47", sub: "this term",     color: "from-spira-600 to-spira-800" },
              { label: "Sent to Parents",     value: "18", sub: "messages",      color: "from-blue-500 to-blue-700"   },
              { label: "Unread",              value: "5",  sub: "pending review",color: "from-amber-500 to-orange-600"},
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
              <h2 className="text-sm font-semibold text-text-900">Recent Announcements</h2>
              <Link href="/announcements" className="text-xs text-spira-700 hover:underline">All â†’</Link>
            </div>
            <div className="divide-y divide-surface-100">
              {ANNOUNCEMENTS_RECENT.map((a) => (
                <Link key={a.id} href={`/announcements/${a.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50">
                  <div className="w-10 h-10 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-lg shrink-0">ðŸ“¢</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-900 truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-400">{a.date}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-surface-100 text-text-500 rounded capitalize">{a.audience}</span>
                    </div>
                  </div>
                  <span className="text-xs text-text-400 shrink-0">â†’</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ REPORTS â”€â”€ */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Attendance Report",      desc: "Grade-wise and class-wise daily/weekly/monthly attendance",   icon: "ðŸ“‹", href: "/attendance" },
              { title: "Fee Collection Report",  desc: "Invoice-wise, grade-wise, and month-wise fee analytics",       icon: "ðŸ’°", href: "/fees"       },
              { title: "Exam Results Report",    desc: "Subject-wise marks, grade distribution, pass/fail analysis",  icon: "ðŸ“Š", href: "/exams"      },
              { title: "Student Progress",       desc: "Individual student academic performance across terms",         icon: "ðŸŽ“", href: "/students"   },
              { title: "Transport Report",       desc: "Route usage, driver performance, fuel logs, on-time rate",    icon: "ðŸšŒ", href: "/transport"  },
              { title: "Analytics Dashboard",   desc: "School-wide KPIs, trends, and comparative analysis",          icon: "ðŸ“ˆ", href: "/analytics"  },
              { title: "Staff Report",           desc: "Attendance, leaves, payroll, and performance overview",       icon: "ðŸ‘¨â€ðŸ«", href: "/staff"      },
              { title: "Library Report",         desc: "Issue/return history, overdue books, catalog utilization",    icon: "ðŸ“š", href: "/documents"  },
              { title: "Hostel Report",          desc: "Occupancy rates, room allocations, warden logs",              icon: "ðŸ ", href: "/documents"  },
            ].map((r) => (
              <Link key={r.title} href={r.href} className="bg-white rounded-2xl border border-border p-5 hover:border-spira-400 hover:shadow-md transition-all group">
                <div className="text-3xl mb-3">{r.icon}</div>
                <p className="font-semibold text-text-900 group-hover:text-spira-700 transition-colors">{r.title}</p>
                <p className="text-xs text-text-400 mt-1 leading-relaxed">{r.desc}</p>
                <p className="text-xs text-spira-700 mt-3 font-medium">View Report â†’</p>
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
              <button onClick={() => setStudentModal(null)} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-surface-50">Edit</button>
              <button onClick={() => setStudentModal(null)} className="flex-1 py-2 text-sm bg-spira-700 text-white rounded-lg hover:bg-spira-800">Full Profile</button>
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
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold">{staffModal.name.split(" ").map(n => n[0]).join("").slice(0,2)}</div>
              <div>
                <p className="font-semibold text-text-900 text-lg">{staffModal.name}</p>
                <p className="text-xs text-text-400">{staffModal.role} Â· {staffModal.dept}</p>
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
              <button onClick={() => { setStaffModal(null); showToast(`Messaged ${staffModal.name}`); }} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-surface-50">Message</button>
              <Link href="/staff" className="flex-1 py-2 text-sm bg-spira-700 text-white rounded-lg hover:bg-spira-800 text-center">Full Profile</Link>
            </div>
            <button onClick={() => setStaffModal(null)} className="mt-3 w-full text-xs text-text-400 hover:text-text-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
