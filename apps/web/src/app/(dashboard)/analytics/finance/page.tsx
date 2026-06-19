"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface MonthRow {
  month: string;
  collected: number;
  transactions: number;
}

interface FinanceReport {
  rows: MonthRow[];
  byMethod: Record<string, number>;
  summary: {
    totalCollected: number;
    totalTransactions: number;
    pendingCount: number;
    overdueCount: number;
  };
}

export default function FinanceReportPage() {
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => { setMounted(true); }, []);

  const key = mounted && !!getAccessToken()
    ? `/analytics/finance?from=${from}&to=${to}`
    : null;

  const { data, isLoading } = useSWR<FinanceReport>(
    key,
    (url: string) => apiClient.get<FinanceReport>(url),
  );

  const exportUrl = `/api/v1/analytics/finance/export?from=${from}&to=${to}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Finance Report</h1>
          <p className="text-text-500 text-sm mt-0.5">Monthly fee collection summary</p>
        </div>
        <Link href="/analytics" className="text-sm text-spira-700 hover:underline">← Analytics</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-text-600 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-text-900 focus:outline-none focus:ring-2 focus:ring-spira-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-600 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm text-text-900 focus:outline-none focus:ring-2 focus:ring-spira-500"
          />
        </div>
        <a
          href={exportUrl}
          className="px-4 py-1.5 bg-spira-700 text-white text-sm font-medium rounded-md hover:bg-spira-800 transition-colors"
          download
        >
          Export CSV
        </a>
      </div>

      {/* Summary KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Collected", value: `₹ ${data.summary.totalCollected.toLocaleString()}`, color: "text-green-700" },
            { label: "Transactions", value: data.summary.totalTransactions, color: "text-text-900" },
            { label: "Pending Invoices", value: data.summary.pendingCount, color: "text-yellow-700" },
            { label: "Overdue Invoices", value: data.summary.overdueCount, color: "text-red-600" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-lg border border-border shadow-sm p-4">
              <p className="text-text-400 text-xs uppercase tracking-wide mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly table */}
        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100">
            <h2 className="font-medium text-text-900">Monthly Breakdown</h2>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 bg-surface-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !data || data.rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-400">No payments in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide">Month</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide">Collected</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide">Txns</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.month} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-text-700">{r.month}</td>
                    <td className="px-5 py-3 text-right font-medium text-green-700">₹ {r.collected.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-text-600">{r.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* By payment method */}
        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100">
            <h2 className="font-medium text-text-900">By Payment Method</h2>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 bg-surface-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !data || Object.keys(data.byMethod).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-400">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide">Method</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.byMethod).map(([method, amount]) => (
                  <tr key={method} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-text-700 capitalize">{method.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-right font-medium text-green-700">₹ {amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
