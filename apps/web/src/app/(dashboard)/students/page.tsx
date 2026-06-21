"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types";
import { canCreate } from "@/lib/permissions";

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  enrollmentStatus: string;
  section?: { name: string };
  user?: { email: string };
}

interface PagedStudents {
  data: Student[];
  total: number;
  page: number;
  totalPages: number;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();
  const roles = (user?.roles ?? []) as Role[];
  const canAdd = canCreate(roles, "students");

  const { data, isLoading } = useSWR<PagedStudents>(
    hasToken ? `/students?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}` : null,
    (url: string) => apiClient.get<PagedStudents>(url),
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Students</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} enrolled</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="search"
            placeholder="Search studentsâ€¦"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search students"
            className="flex-1 md:w-64 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white"
          />
          {canAdd && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-lg hover:bg-spira-800 active:bg-spira-900 transition-colors whitespace-nowrap">
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-1/3" />
              <div className="h-4 bg-surface-100 rounded w-2/3" />
              <div className="h-3 bg-surface-100 rounded w-1/2" />
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-500 text-sm">
            No students found
          </div>
        ) : (
          data?.data.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-border p-4 active:bg-surface-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs font-mono text-text-500 mt-0.5">{s.admissionNo}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {s.section && (
                      <span className="text-xs bg-surface-100 text-text-600 px-2 py-0.5 rounded-full">
                        {s.section.name}
                      </span>
                    )}
                    <span className="text-xs text-text-500 capitalize">{s.gender}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.enrollmentStatus === "active" ? "bg-success/10 text-success" : "bg-surface-100 text-text-500"}`}>
                      {s.enrollmentStatus}
                    </span>
                  </div>
                  {s.user?.email && (
                    <p className="text-xs text-text-400 mt-1.5 truncate">{s.user.email}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Students list">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Admission No.</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Name</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Section</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Gender</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Email</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-text-500">No students found</td></tr>
              ) : (
                data?.data.map((s) => (
                  <tr key={s.id} className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer transition-colors" tabIndex={0} role="row">
                    <td className="px-4 py-3 font-mono text-xs text-text-500">{s.admissionNo}</td>
                    <td className="px-4 py-3 font-medium text-text-900">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3 text-text-500">{s.section?.name ?? "â€”"}</td>
                    <td className="px-4 py-3 text-text-500 capitalize">{s.gender}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.enrollmentStatus === "active" ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
                        {s.enrollmentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-500 text-xs">{s.user?.email ?? "â€”"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-xs text-text-500">Page {data.page} of {data.totalPages} Â· {data.total} students</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors">Previous</button>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors">Next</button>
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
