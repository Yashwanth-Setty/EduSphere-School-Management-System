"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { AuthUser } from "@spira/types";

interface Invoice {
  id: string;
  invoiceNo: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  feePlan: { name: string; currency: string };
  studentProfile: { firstName: string; lastName: string; admissionNo: string };
}

interface Exam {
  id: string;
  title: string;
  examDate: string | null;
  isPublished: boolean;
  courseOffering: { course: { code: string; name: string }; section: { name: string } };
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
  audienceScope: string;
}

const STATUS_STYLE: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  pending: "bg-red-100 text-red-700",
};

export function ParentDashboard({ user }: { user: AuthUser }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ready = mounted && !!getAccessToken();

  const { data: invoices } = useSWR<{ data: Invoice[]; total: number }>(
    ready ? "/fees/my-invoices?page=1&pageSize=10" : null,
    (url: string) => apiClient.get<{ data: Invoice[]; total: number }>(url),
  );

  const { data: exams } = useSWR<{ data: Exam[]; total: number }>(
    ready ? "/exams?page=1&pageSize=5" : null,
    (url: string) => apiClient.get<{ data: Exam[]; total: number }>(url),
  );

  const { data: announcements } = useSWR<{ data: Announcement[]; total: number }>(
    ready ? "/announcements?page=1&pageSize=5" : null,
    (url: string) => apiClient.get<{ data: Announcement[]; total: number }>(url),
  );

  const pendingInvoices = (invoices?.data ?? []).filter((i) => i.status !== "paid");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-900">Parent Dashboard</h1>
        <p className="text-text-500 text-sm mt-1">
          Welcome back, <span className="font-medium text-text-700">{user.displayName}</span>
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-text-900">{invoices?.total ?? "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Pending Fees</p>
          <p className={`text-2xl font-bold ${pendingInvoices.length > 0 ? "text-warning" : "text-success"}`}>
            {pendingInvoices.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-xs text-text-500 mb-1">Published Results</p>
          <p className="text-2xl font-bold text-text-900">
            {(exams?.data ?? []).filter((e) => e.isPublished).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Fee Invoices */}
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-900">Fee Invoices</h2>
              <Link href="/fees" className="text-xs text-spira-700 hover:underline">View all →</Link>
            </div>
            {(invoices?.data ?? []).length === 0 ? (
              <p className="text-sm text-text-500">No invoices found.</p>
            ) : (
              <div className="space-y-2">
                {(invoices?.data ?? []).slice(0, 5).map((inv) => (
                  <Link key={inv.id} href={`/fees/${inv.id}`} className="flex items-center justify-between p-3 rounded-md border border-surface-100 hover:bg-surface-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-900">{inv.feePlan.name}</p>
                      <p className="text-xs text-text-500">
                        {inv.studentProfile.firstName} {inv.studentProfile.lastName} · Due {new Date(inv.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-900">{inv.feePlan.currency} {inv.amountDue.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[inv.status] ?? ""}`}>
                        {inv.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-900">Child Results</h2>
              <Link href="/exams" className="text-xs text-spira-700 hover:underline">View all →</Link>
            </div>
            {(exams?.data ?? []).filter((e) => e.isPublished).length === 0 ? (
              <p className="text-sm text-text-500">No published results.</p>
            ) : (
              <div className="space-y-2">
                {(exams?.data ?? []).filter((e) => e.isPublished).map((e) => (
                  <Link key={e.id} href={`/exams/${e.id}`} className="flex items-center justify-between p-3 rounded-md border border-surface-100 hover:bg-surface-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-900">{e.title}</p>
                      <p className="text-xs text-text-500">{e.courseOffering.course.name} · {e.courseOffering.section.name}</p>
                    </div>
                    <span className="text-xs text-spira-700">View →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-900 mb-4">Quick Actions</h2>
            <div className="space-y-1">
              <Link href="/fees" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>💰</span> View Fee Invoices
              </Link>
              <Link href="/exams" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>📊</span> Child Results
              </Link>
              <Link href="/documents" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>📄</span> Documents
              </Link>
              <Link href="/announcements" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-700 hover:bg-surface-50 rounded-md transition-colors">
                <span>📢</span> Announcements
              </Link>
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-900">Announcements</h2>
              <Link href="/announcements" className="text-xs text-spira-700 hover:underline">All →</Link>
            </div>
            {(announcements?.data ?? []).length === 0 ? (
              <p className="text-sm text-text-500">No announcements.</p>
            ) : (
              <div className="space-y-2">
                {(announcements?.data ?? []).slice(0, 4).map((ann) => (
                  <Link key={ann.id} href={`/announcements/${ann.id}`} className="block p-2 hover:bg-surface-50 rounded transition-colors">
                    <p className="text-sm font-medium text-text-900 truncate">{ann.title}</p>
                    <p className="text-xs text-text-400 mt-0.5">
                      {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString("en-IN", { timeZone: "UTC" }) : ""}
                    </p>
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
