"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { canCreate, canPayInvoice } from "@/lib/permissions";

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
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user?.roles ?? []) as Role[];
  const canNew = canCreate(roles, "fees");
  const isStudent = roles.includes(Role.STUDENT);
  const isParent = roles.includes(Role.PARENT);
  const showPayAction = canPayInvoice(roles);

  const endpoint = isStudent || isParent ? "/fees/my-invoices" : "/fees/invoices";

  const { data, isLoading } = useSWR<Paged>(
    mounted && !!getAccessToken()
      ? `${endpoint}?page=${page}&pageSize=20${statusFilter ? `&status=${statusFilter}` : ""}`
      : null,
    (url: string) => apiClient.get<Paged>(url),
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">
            {isStudent || isParent ? "My Fees" : "Fee Invoices"}
          </h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} invoices</p>
        </div>
        {canNew && (
          <div className="flex items-center gap-2">
            <Link href="/fees/plans" className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-lg hover:bg-surface-50 transition-colors">Fee Plans</Link>
            <Link href="/fees/dashboard" className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-lg hover:bg-surface-50 transition-colors">Dashboard</Link>
            <Link href="/fees/new" className="px-4 py-2.5 text-sm font-medium text-white bg-spira-700 rounded-lg hover:bg-spira-800 transition-colors">+ New</Link>
          </div>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["", "pending", "partial", "paid"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-colors ${statusFilter === s ? "bg-spira-700 text-white border-spira-700" : "border-border text-text-600 bg-white"}`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-2/3" />
              <div className="h-3 bg-surface-100 rounded w-1/2" />
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-500 text-sm">No invoices found</div>
        ) : (
          data?.data.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-text-900">{inv.feePlan.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[inv.status] ?? "bg-surface-100 text-text-500"}`}>
                      {inv.status}
                    </span>
                  </div>
                  {!isStudent && (
                    <p className="text-sm text-text-500">{inv.studentProfile.firstName} {inv.studentProfile.lastName}</p>
                  )}
                  <p className="text-xs font-mono text-text-400 mt-0.5">{inv.invoiceNo}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div>
                      <p className="text-xs text-text-400">Amount</p>
                      <p className="text-sm font-semibold text-text-900">{inv.feePlan.currency} {inv.amountDue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-400">Paid</p>
                      <p className="text-sm font-medium text-text-700">{inv.feePlan.currency} {inv.amountPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-400">Due date</p>
                      <p className="text-sm text-text-700">{new Date(inv.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</p>
                    </div>
                  </div>
                </div>
                <Link href={`/fees/${inv.id}`} className="text-sm text-spira-700 font-medium shrink-0">
                  {showPayAction && inv.status !== "paid" ? "Pay →" : "View →"}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Fee invoices">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Invoice #</th>
                {!isStudent && <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Student</th>}
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
                    {Array.from({ length: isStudent ? 7 : 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? <tr><td colSpan={isStudent ? 7 : 8} className="px-4 py-12 text-center text-text-500">No invoices found</td></tr>
                  : data?.data.map((inv) => (
                    <tr key={inv.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-spira-800">{inv.invoiceNo}</td>
                      {!isStudent && (
                        <td className="px-4 py-3 font-medium text-text-900">
                          {inv.studentProfile.firstName} {inv.studentProfile.lastName}
                          <span className="text-text-400 text-xs ml-1">({inv.studentProfile.admissionNo})</span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-text-600">{inv.feePlan.name}</td>
                      <td className="px-4 py-3 text-text-900 font-medium">{inv.feePlan.currency} {inv.amountDue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-600">{inv.feePlan.currency} {inv.amountPaid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-500">{new Date(inv.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[inv.status] ?? "bg-surface-100 text-text-500"}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/fees/${inv.id}`} className="text-xs text-spira-700 hover:underline">
                          {showPayAction && inv.status !== "paid" ? "Pay" : "View"}
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-xs text-text-500">Page {data.page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Previous</button>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between pt-1">
          <p className="text-xs text-text-500">Page {data.page} of {data.totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-xs border border-border rounded-lg disabled:opacity-40 bg-white">Prev</button>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-xs border border-border rounded-lg disabled:opacity-40 bg-white">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
