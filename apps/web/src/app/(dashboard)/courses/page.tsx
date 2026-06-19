"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count: { offerings: number };
}

interface PagedCourses {
  data: Course[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();

  const { data, isLoading } = useSWR<PagedCourses>(
    hasToken
      ? `/courses?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`
      : null,
    (url: string) => apiClient.get<PagedCourses>(url),
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Courses</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} courses</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search by name or code"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search courses"
            className="px-3 py-2 text-sm border border-border rounded-md w-60 focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white"
          />
          <Link
            href="/courses/new"
            className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors"
          >
            + New course
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Courses list">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Code</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Name</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Description</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Offerings</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-500">No courses found</td>
                    </tr>
                  )
                  : data?.data.map((c) => (
                    <tr key={c.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-spira-800">{c.code}</td>
                      <td className="px-4 py-3 font-medium text-text-900">{c.name}</td>
                      <td className="px-4 py-3 text-text-500 text-xs max-w-xs truncate">{c.description ?? "—"}</td>
                      <td className="px-4 py-3 text-text-500">{c._count.offerings} section{c._count.offerings !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/courses/${c.id}`} className="text-xs text-spira-700 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-xs text-text-500">Page {data.page} of {data.totalPages} · {data.total} courses</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors"
                aria-label="Previous page"
              >Previous</button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors"
                aria-label="Next page"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
