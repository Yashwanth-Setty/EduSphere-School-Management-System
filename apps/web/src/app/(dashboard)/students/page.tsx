"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();

  const { data, isLoading } = useSWR<PagedStudents>(
    hasToken ? `/students?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}` : null,
    (url: string) => apiClient.get<PagedStudents>(url),
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Students</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} enrolled students</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search by name or admission no."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search students"
            className="px-3 py-2 text-sm border border-border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white"
          />
          <button className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors">
            + Add student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Students list">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">
                  Admission No.
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">
                  Name
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">
                  Section
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">
                  Gender
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">
                  Status
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-500">
                    No students found
                  </td>
                </tr>
              ) : (
                data?.data.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer transition-colors"
                    tabIndex={0}
                    role="row"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-text-500">{s.admissionNo}</td>
                    <td className="px-4 py-3 font-medium text-text-900">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-4 py-3 text-text-500">{s.section?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-text-500 capitalize">{s.gender}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.enrollmentStatus === "active"
                            ? "bg-success/10 text-success"
                            : "bg-text-500/10 text-text-500"
                        }`}
                      >
                        {s.enrollmentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-500 text-xs">{s.user?.email ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-xs text-text-500">
              Page {data.page} of {data.totalPages} · {data.total} students
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors"
                aria-label="Previous page"
              >
                Previous
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
