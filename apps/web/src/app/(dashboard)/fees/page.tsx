"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Invoice {
  id: string;
  invoiceNo: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  issuedAt: string;
  feePlan: { name: string; currency: string };
  studentProfile: { admissionNo: string; firstName: string; lastName: string };
  _count: { payments: number };
}

interface Paged { data: Invoice[]; total: number; page: number; totalPages: number }

const STATUS_STYLE: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  pending: "bg-red-100 text-red-700",
};

export default function FeesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useSWR<Paged>(
    mounted && !!getAccessToken()
      ? `/fees/invoices?page=${page}&pageSize=20${statusFilter ? `&status=${statusFilter}` : ""}`
      : null,
    (url: string) => apiClient.get<Paged>(url),
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Fee Invoices</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/fees/plans"
            className="px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-md hover:bg-surface-50 transition-colors"
          >
            Fee Plans
          </Link>
          <Link
            href="/fees/dashboard"
            className="px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-md hover:bg-surface-50 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/fees/new"
            className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        {["", "pending", "partial", "paid"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${statusFilter === s ? "bg-spira-700 text-white border-spira-700" : "border-border text-text-600 hover:bg-surface-50"}`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Fee invoices">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Invoice #</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Student</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Fee Plan</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Due</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Paid</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Due Date</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
                <th scope="col" className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? <tr><td colSpan={8} className="px-4 py-12 text-center text-text-500">No invoices found</td></tr>
                  : data?.data.map((inv) => (
                    <tr key={inv.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-spira-800">{inv.invoiceNo}</td>
                      <td className="px-4 py-3 font-medium text-text-900">
                        {inv.studentProfile.firstName} {inv.studentProfile.lastName}
                        <span className="text-text-400 text-xs ml-1">({inv.studentProfile.admissionNo})</span>
                      </td>
                      <td className="px-4 py-3 text-text-600">{inv.feePlan.name}</td>
                      <td className="px-4 py-3 text-text-900 font-medium">
                        {inv.feePlan.currency} {inv.amountDue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-text-600">
                        {inv.feePlan.currency} {inv.amountPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-text-500">
                        {new Date(inv.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[inv.status] ?? "bg-surface-100 text-text-500"}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/fees/${inv.id}`} className="text-xs text-spira-700 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-xs text-text-500">Page {data.page} of {data.totalPages}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Previous</button>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
