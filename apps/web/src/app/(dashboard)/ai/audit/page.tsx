"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { displayName: string; email: string } | null;
}

interface Page {
  data: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_LABELS: Record<string, string> = {
  "ai.attendance_risk.run": "Attendance Risk Run",
  "ai.performance_summary.run": "Performance Summary Run",
};

export default function AiAuditPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  const key = mounted && !!getAccessToken() ? `/ai/audit-logs?page=${page}&pageSize=20` : null;
  const { data, isLoading } = useSWR<Page>(key, (url: string) => apiClient.get<Page>(url));

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">AI Audit Log</h1>
          <p className="text-text-500 text-sm mt-0.5">History of all AI analysis runs for this school</p>
        </div>
        <Link href="/ai" className="text-sm text-spira-700 hover:underline">â† AI Insights</Link>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-text-400">
            No AI runs recorded yet. Use the AI Insights page to trigger an analysis.
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  {["Timestamp", "Action", "Run By", "Processed", "Created"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((entry) => {
                  const meta = entry.metadata as Record<string, unknown> | null;
                  return (
                    <tr key={entry.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 text-text-600 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString("en-IN", { timeZone: "UTC" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-spira-500/10 text-spira-900 px-2 py-0.5 rounded-full">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-700">
                        {entry.user
                          ? <span>{entry.user.displayName} <span className="text-text-400 text-xs">({entry.user.email})</span></span>
                          : <span className="text-text-400">â€”</span>}
                      </td>
                      <td className="px-4 py-3 text-text-700">
                        {meta?.processed != null ? String(meta.processed) : "â€”"}
                      </td>
                      <td className="px-4 py-3 text-text-700">
                        {meta?.created != null ? String(meta.created) : "â€”"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {data.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-surface-100 flex items-center justify-between">
                <p className="text-xs text-text-400">Page {data.page} of {data.totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.page <= 1}
                    className="px-3 py-1.5 text-sm border border-border rounded-md text-text-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={data.page >= data.totalPages}
                    className="px-3 py-1.5 text-sm border border-border rounded-md text-text-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

