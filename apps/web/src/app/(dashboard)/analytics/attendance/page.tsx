"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface AttendanceRow {
  sessionId: string;
  sectionName: string;
  sessionDate: string;
  periodNumber: number;
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface AttendanceReport {
  rows: AttendanceRow[];
  summary: {
    sessions: number;
    overallTotal: number;
    overallPresent: number;
    overallRate: number;
  };
}

export default function AttendanceReportPage() {
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => { setMounted(true); }, []);

  const key = mounted && !!getAccessToken()
    ? `/analytics/attendance?from=${from}&to=${to}`
    : null;

  const { data, isLoading } = useSWR<AttendanceReport>(
    key,
    (url: string) => apiClient.get<AttendanceReport>(url),
  );

  const exportUrl = `/api/v1/analytics/attendance/export?from=${from}&to=${to}`;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Attendance Report</h1>
          <p className="text-text-500 text-sm mt-0.5">Session-level attendance rates</p>
        </div>
        <Link href="/analytics" className="text-sm text-spira-700 hover:underline">â† Analytics</Link>
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
            { label: "Sessions", value: data.summary.sessions, color: "text-text-900" },
            { label: "Total Marks", value: data.summary.overallTotal, color: "text-text-900" },
            { label: "Present", value: data.summary.overallPresent, color: "text-green-700" },
            { label: "Overall Rate", value: `${data.summary.overallRate}%`, color: data.summary.overallRate >= 75 ? "text-green-700" : "text-red-600" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-lg border border-border shadow-sm p-4">
              <p className="text-text-400 text-xs uppercase tracking-wide mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 bg-surface-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-text-400">No attendance sessions found for this date range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                {["Date", "Section", "Period", "Total", "Present", "Absent", "Late", "Rate"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.sessionId} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 text-text-700 whitespace-nowrap">
                    {new Date(r.sessionDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                  </td>
                  <td className="px-4 py-3 text-text-700">{r.sectionName}</td>
                  <td className="px-4 py-3 text-text-600">P{r.periodNumber}</td>
                  <td className="px-4 py-3 text-text-600">{r.total}</td>
                  <td className="px-4 py-3 text-green-700 font-medium">{r.present}</td>
                  <td className="px-4 py-3 text-red-600">{r.absent}</td>
                  <td className="px-4 py-3 text-yellow-700">{r.late}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${r.attendanceRate >= 75 ? "text-green-700" : "text-red-600"}`}>
                      {r.attendanceRate}%
                    </span>
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

