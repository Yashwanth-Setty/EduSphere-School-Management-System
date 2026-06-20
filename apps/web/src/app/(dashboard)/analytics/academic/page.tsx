"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface AcademicRow {
  examId: string;
  examTitle: string;
  examType: string;
  term: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  maxMarks: number;
  totalStudents: number;
  avgMarks: number | null;
  avgPercent: number | null;
}

interface AcademicReport {
  rows: AcademicRow[];
}

export default function AcademicReportPage() {
  const [mounted, setMounted] = useState(false);
  const [term, setTerm] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const params = term ? `?term=${encodeURIComponent(term)}` : "";
  const key = mounted && !!getAccessToken() ? `/analytics/academic${params}` : null;

  const { data, isLoading } = useSWR<AcademicReport>(
    key,
    (url: string) => apiClient.get<AcademicReport>(url),
  );

  const exportUrl = `/api/v1/analytics/academic/export${params}`;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Academic Performance</h1>
          <p className="text-text-500 text-sm mt-0.5">Exam averages by course and section</p>
        </div>
        <Link href="/analytics" className="text-sm text-spira-700 hover:underline">â† Analytics</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-text-600 mb-1">Term</label>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. term_1"
            className="border border-border rounded-md px-3 py-1.5 text-sm text-text-900 focus:outline-none focus:ring-2 focus:ring-spira-500 w-36"
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

      {/* Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 bg-surface-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-text-400">No published exam results found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                {["Exam", "Type", "Term", "Course", "Section", "Max Marks", "Students", "Avg Marks", "Avg %"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-text-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.examId} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-900">{r.examTitle}</td>
                  <td className="px-4 py-3 text-text-600 capitalize">{r.examType}</td>
                  <td className="px-4 py-3 text-text-600">{r.term}</td>
                  <td className="px-4 py-3 text-text-700">{r.courseCode} â€” {r.courseName}</td>
                  <td className="px-4 py-3 text-text-600">{r.sectionName}</td>
                  <td className="px-4 py-3 text-text-600">{r.maxMarks}</td>
                  <td className="px-4 py-3 text-text-600">{r.totalStudents}</td>
                  <td className="px-4 py-3 text-text-700">{r.avgMarks ?? "â€”"}</td>
                  <td className="px-4 py-3">
                    {r.avgPercent != null ? (
                      <span className={`font-semibold ${r.avgPercent >= 40 ? "text-green-700" : "text-red-600"}`}>
                        {r.avgPercent}%
                      </span>
                    ) : "â€”"}
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

