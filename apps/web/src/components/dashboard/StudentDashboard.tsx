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

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseOffering: { course: { code: string } };
}

interface Exam {
  id: string;
  title: string;
  examDate: string | null;
  isPublished: boolean;
  courseOffering: { course: { code: string } };
}

interface Invoice {
  id: string;
  invoiceNo: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  feePlan: { name: string; currency: string };
}

const STATUS_STYLE: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  pending: "bg-red-100 text-red-700",
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function StudentDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ready = mounted && !!getAccessToken();
  const todayDow = (new Date().getDay() + 6) % 7;

  const { data: slots } = useSWR<{ data: TimetableSlot[] }>(
    ready ? "/timetable/slots" : null,
    (url: string) => apiClient.get<{ data: TimetableSlot[] }>(url),
  );

  const { data: assignments } = useSWR<{ data: Assignment[]; total: number }>(
    ready ? "/assignments?page=1&pageSize=5" : null,
    (url: string) => apiClient.get<{ data: Assignment[]; total: number }>(url),
  );

  const { data: exams } = useSWR<{ data: Exam[]; total: number }>(
    ready ? "/exams?page=1&pageSize=5" : null,
    (url: string) => apiClient.get<{ data: Exam[]; total: number }>(url),
  );

  const { data: invoices } = useSWR<{ data: Invoice[]; total: number }>(
    ready ? "/fees/my-invoices?page=1&pageSize=5" : null,
    (url: string) => apiClient.get<{ data: Invoice[]; total: number }>(url),
  );

  const todaySlots = (slots?.data ?? []).filter((s) => s.dayOfWeek === todayDow)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  const pendingInvoices = (invoices?.data ?? []).filter((i) => i.status !== "paid");

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-900">My Dashboard</h1>
        <p className="text-text-500 text-sm mt-1">
          Welcome back, <span className="font-medium text-text-700">{user.displayName}</span> · {DAY_NAMES[todayDow]}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Today&apos;s Classes</p>
          <p className="text-2xl font-bold text-text-900">{todaySlots.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Assignments</p>
          <p className="text-2xl font-bold text-text-900">{assignments?.total ?? "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Exams</p>
          <p className="text-2xl font-bold text-text-900">{exams?.total ?? "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Pending Fees</p>
          <p className={`text-2xl font-bold ${pendingInvoices.length > 0 ? "text-warning" : "text-success"}`}>
            {pendingInvoices.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's timetable */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-900">Today&apos;s Timetable</h2>
              <Link href="/timetable" className="text-xs text-spira-700 hover:underline">View full →</Link>
            </div>
            {todaySlots.length === 0 ? (
              <p className="text-sm text-text-500">No classes today.</p>
            ) : (
              <div className="space-y-2">
                {todaySlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-3 p-3 rounded-md bg-surface-50 border border-surface-100">
                    <div className="text-xs text-text-400 w-20 shrink-0">{slot.startTime} – {slot.endTime}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-900 truncate">{slot.courseOffering.course.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Assignments */}
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-900">My Assignments</h2>
              <Link href="/assignments" className="text-xs text-spira-700 hover:underline">View all →</Link>
            </div>
            {(assignments?.data ?? []).length === 0 ? (
              <p className="text-sm text-text-500">No assignments.</p>
            ) : (
              <div className="space-y-2">
                {(assignments?.data ?? []).map((a) => (
                  <Link key={a.id} href={`/assignments/${a.id}`} className="flex items-center justify-between p-3 rounded-md hover:bg-surface-50 border border-surface-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-900">{a.title}</p>
                      <p className="text-xs text-text-500">{a.courseOffering.course.code}</p>
                    </div>
                    <span className="text-xs text-text-400">Due {new Date(a.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Fee Status */}
          {pendingInvoices.length > 0 && (
            <div className="bg-white rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-900">Fee Status</h2>
                <Link href="/fees" className="text-xs text-spira-700 hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {pendingInvoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-md bg-surface-50 border border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-text-900">{inv.feePlan.name}</p>
                      <p className="text-xs text-text-500">Due {new Date(inv.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-900">{inv.feePlan.currency} {inv.amountDue.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[inv.status] ?? ""}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-900 mb-4">Quick Actions</h2>
            <div className="space-y-1">
              <Link href="/assignments" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>📝</span> Submit Assignment
              </Link>
              <Link href="/exams" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>📊</span> View My Results
              </Link>
              <Link href="/fees" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>💰</span> My Fee Invoices
              </Link>
              <Link href="/documents" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>📄</span> Documents
              </Link>
              <Link href="/announcements" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>📢</span> Announcements
              </Link>
            </div>
          </div>

          {/* Recent exams */}
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-900">My Results</h2>
              <Link href="/exams" className="text-xs text-spira-700 hover:underline">View all →</Link>
            </div>
            {(exams?.data ?? []).length === 0 ? (
              <p className="text-sm text-text-500">No results yet.</p>
            ) : (
              <div className="space-y-2">
                {(exams?.data ?? []).filter((e) => e.isPublished).slice(0, 3).map((e) => (
                  <Link key={e.id} href={`/exams/${e.id}`} className="flex items-center justify-between p-2 hover:bg-surface-50 rounded transition-colors">
                    <p className="text-sm text-text-700 truncate">{e.title}</p>
                    <span className="text-xs text-text-400 shrink-0 ml-2">{e.courseOffering.course.code}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
