"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { canCreate } from "@/lib/permissions";

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
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();
  const roles = (user?.roles ?? []) as Role[];
  const canNew = canCreate(roles, "courses");

  const { data, isLoading } = useSWR<PagedCourses>(
    hasToken ? `/courses?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}` : null,
    (url: string) => apiClient.get<PagedCourses>(url),
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Courses</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} courses</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search courses"
            className="flex-1 md:w-60 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white"
          />
          {canNew && (
            <Link href="/courses/new" className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-lg hover:bg-spira-800 transition-colors whitespace-nowrap">
              + New
            </Link>
          )}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-1/4" />
              <div className="h-4 bg-surface-100 rounded w-2/3" />
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-500 text-sm">No courses found</div>
        ) : (
          data?.data.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-semibold text-spira-700 bg-spira-500/10 px-2 py-0.5 rounded">{c.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-success/10 text-success" : "bg-surface-100 text-text-500"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="font-semibold text-text-900">{c.name}</p>
                  {c.description && <p className="text-xs text-text-500 mt-0.5 line-clamp-2">{c.description}</p>}
                  <p className="text-xs text-text-400 mt-1">{c._count.offerings} section{c._count.offerings !== 1 ? "s" : ""}</p>
                </div>
                <Link href={`/courses/${c.id}`} className="text-sm text-spira-700 font-medium shrink-0">View →</Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-border shadow-sm overflow-hidden">
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
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-text-500">No courses found</td></tr>
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
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors">Previous</button>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

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
