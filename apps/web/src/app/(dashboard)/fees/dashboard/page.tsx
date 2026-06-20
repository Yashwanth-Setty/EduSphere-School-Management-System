"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Payment {
  id: string; amount: number; method: string; paidAt: string | null;
  feeInvoice: {
    invoiceNo: string;
    feePlan: { name: string; currency: string };
    studentProfile: { firstName: string; lastName: string };
  };
}

interface Dashboard {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalCollected: number;
  totalOutstanding: number;
  recentPayments: Payment[];
}

export default function FinanceDashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useSWR<Dashboard>(
    mounted && !!getAccessToken() ? "/fees/dashboard" : null,
    (url: string) => apiClient.get<Dashboard>(url),
  );

  const stats = [
    { label: "Total Invoices", value: data?.totalInvoices ?? 0, color: "text-text-900" },
    { label: "Paid", value: data?.paidInvoices ?? 0, color: "text-green-700" },
    { label: "Pending / Partial", value: data?.pendingInvoices ?? 0, color: "text-yellow-700" },
    { label: "Overdue", value: data?.overdueInvoices ?? 0, color: "text-red-600" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Finance Dashboard</h1>
          <p className="text-text-500 text-sm mt-0.5">School fee collection overview</p>
        </div>
        <Link href="/fees" className="text-sm text-spira-700 hover:underline">â† All Invoices</Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-border shadow-sm p-5">
            <p className="text-text-400 text-xs uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>
              {isLoading ? <span className="inline-block h-8 w-12 bg-surface-100 rounded animate-pulse" /> : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-border shadow-sm p-5">
          <p className="text-text-400 text-xs uppercase tracking-wide mb-1">Total Collected</p>
          {isLoading
            ? <div className="h-8 w-32 bg-surface-100 rounded animate-pulse" />
            : <p className="text-2xl font-bold text-green-700">â‚¹ {(data?.totalCollected ?? 0).toLocaleString()}</p>
          }
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-5">
          <p className="text-text-400 text-xs uppercase tracking-wide mb-1">Outstanding Balance</p>
          {isLoading
            ? <div className="h-8 w-32 bg-surface-100 rounded animate-pulse" />
            : <p className="text-2xl font-bold text-red-600">â‚¹ {(data?.totalOutstanding ?? 0).toLocaleString()}</p>
          }
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-surface-100">
          <h2 className="font-medium text-text-900">Recent Payments</h2>
        </div>
        {isLoading
          ? <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-5 bg-surface-100 rounded animate-pulse" />)}</div>
          : data?.recentPayments.length === 0
            ? <p className="px-6 py-8 text-center text-sm text-text-400">No payments yet.</p>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Fee Plan</th>
                    <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Method</th>
                    <th className="text-right px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                      <td className="px-6 py-3 text-text-600">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "â€”"}
                      </td>
                      <td className="px-6 py-3 font-medium text-text-900">
                        {p.feeInvoice.studentProfile.firstName} {p.feeInvoice.studentProfile.lastName}
                      </td>
                      <td className="px-6 py-3 text-text-600">{p.feeInvoice.feePlan.name}</td>
                      <td className="px-6 py-3 text-text-600 capitalize">{p.method.replace("_", " ")}</td>
                      <td className="px-6 py-3 text-right font-medium text-text-900">
                        {p.feeInvoice.feePlan.currency} {p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </div>
  );
}

