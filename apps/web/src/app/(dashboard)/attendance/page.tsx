"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { canCreate } from "@/lib/permissions";

interface AttendanceSession {
  id: string;
  sessionDate: string;
  periodNumber: number;
  submittedAt?: string;
  section: { name: string };
  teacher?: { user: { displayName: string } };
  _count: { records: number };
}

interface PagedSessions {
  data: AttendanceSession[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();
  const roles = (user?.roles ?? []) as Role[];
  const canOpen = canCreate(roles, "attendance");

  const { data, isLoading } = useSWR<PagedSessions>(
    hasToken ? `/attendance/sessions?page=${page}&pageSize=20` : null,
    (url: string) => apiClient.get<PagedSessions>(url),
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Attendance</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} sessions</p>
        </div>
        {canOpen && (
          <Link href="/attendance/new" className="px-4 py-2.5 text-sm font-medium text-white bg-spira-700 rounded-lg hover:bg-spira-800 active:bg-spira-900 transition-colors">
            + Open session
          </Link>
        )}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-1/2" />
              <div className="h-3 bg-surface-100 rounded w-3/4" />
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-500 text-sm">
            No sessions yet
          </div>
        ) : (
          data?.data.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-900">{s.section.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.submittedAt ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {s.submittedAt ? "Submitted" : "Open"}
                    </span>
                  </div>
                  <p className="text-sm text-text-500 mt-1">
                    {new Date(s.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                    {" · "}Period {s.periodNumber}
                  </p>
                  <p className="text-xs text-text-400 mt-0.5">{s.teacher?.user.displayName ?? "—"} · {s._count.records} records</p>
                </div>
                <Link href={`/attendance/${s.id}`} className="text-sm text-spira-700 font-medium ml-3 shrink-0">
                  {canOpen && !s.submittedAt ? "Mark →" : "View →"}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Attendance sessions">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Date</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Section</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Period</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Teacher</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Records</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-12 text-center text-text-500">No sessions yet</td></tr>
                  : data?.data.map((s) => (
                    <tr key={s.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 text-text-900">{new Date(s.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</td>
                      <td className="px-4 py-3 font-medium text-text-900">{s.section.name}</td>
                      <td className="px-4 py-3 text-text-500">Period {s.periodNumber}</td>
                      <td className="px-4 py-3 text-text-500">{s.teacher?.user.displayName ?? "—"}</td>
                      <td className="px-4 py-3 text-text-500">{s._count.records}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.submittedAt ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          {s.submittedAt ? "Submitted" : "Open"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/attendance/${s.id}`} className="text-xs text-spira-700 hover:underline">
                          {canOpen && !s.submittedAt ? "Mark" : "View"}
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

      {/* Mobile pagination */}
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
