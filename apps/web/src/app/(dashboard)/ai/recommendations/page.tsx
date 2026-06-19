"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface StudentRef {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

interface Recommendation {
  id: string;
  targetId: string;
  recommendationType: string;
  content: string;
  confidence: number | null;
  sourceRange: Record<string, unknown> | null;
  generatedAt: string;
  student: StudentRef | null;
}

interface Page {
  data: Recommendation[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  attendance_risk: "Attendance Risk",
  performance_summary: "Performance Summary",
};

const RISK_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default function RecommendationsPage() {
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (typeFilter) params.set("type", typeFilter);

  const key = mounted && !!getAccessToken() ? `/ai/recommendations?${params}` : null;
  const { data, isLoading } = useSWR<Page>(key, (url: string) => apiClient.get<Page>(url));

  function handleTypeChange(t: string) {
    setTypeFilter(t);
    setPage(1);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">AI Recommendations</h1>
          <p className="text-text-500 text-sm mt-0.5">All insights generated for students in this school</p>
        </div>
        <Link href="/ai" className="text-sm text-spira-700 hover:underline">← AI Insights</Link>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["", "attendance_risk", "performance_summary"].map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              typeFilter === t
                ? "bg-spira-700 text-white border-spira-700"
                : "bg-white text-text-700 border-border hover:border-spira-400"
            }`}
          >
            {t === "" ? "All" : TYPE_LABELS[t] ?? t}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-sm text-text-400 self-center">
            {data.total} recommendation{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-text-400 text-sm">No recommendations yet. Run an analysis job from the AI Insights page.</p>
            <Link href="/ai" className="text-sm text-spira-700 hover:underline mt-2 inline-block">Go to AI Insights →</Link>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  {["Student", "Type", "Risk", "Confidence", "Insight", "Generated"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((r) => {
                  const src = r.sourceRange as Record<string, unknown> | null;
                  const riskLevel = src?.riskLevel as string | undefined;
                  return (
                    <tr key={r.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors align-top">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.student ? (
                          <div>
                            <p className="font-medium text-text-900">{r.student.firstName} {r.student.lastName}</p>
                            <p className="text-xs text-text-400">{r.student.admissionNo}</p>
                          </div>
                        ) : (
                          <span className="text-text-400 text-xs">{r.targetId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-text-600">
                          {TYPE_LABELS[r.recommendationType] ?? r.recommendationType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {riskLevel ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLOR[riskLevel] ?? "bg-surface-100 text-text-600"}`}>
                            {riskLevel}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-text-600">
                        {r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-xs text-text-700 text-xs leading-relaxed">
                        {r.content}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-text-400 text-xs">
                        {new Date(r.generatedAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
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
