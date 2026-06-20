"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { canCreate } from "@/lib/permissions";

interface Exam {
  id: string;
  title: string;
  examType: string;
  term: string;
  maxMarks: number;
  examDate: string | null;
  isPublished: boolean;
  _count: { results: number };
  courseOffering: {
    academicTerm: string;
    course: { code: string; name: string };
    section: { name: string };
  };
}

interface Paged { data: Exam[]; total: number; page: number; totalPages: number }

export default function ExamsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user?.roles ?? []) as Role[];
  const canNew = canCreate(roles, "exams");
  const isReadOnly = roles.includes(Role.STUDENT) || roles.includes(Role.PARENT);

  const { data, isLoading } = useSWR<Paged>(
    mounted && !!getAccessToken() ? `/exams?page=${page}&pageSize=20` : null,
    (url: string) => apiClient.get<Paged>(url),
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Exams & Results</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} exams</p>
        </div>
        {canNew && (
          <div className="flex items-center gap-2">
            <Link href="/grade-scales" className="px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-lg hover:bg-surface-50 transition-colors hidden md:inline-flex">
              Grade Scales
            </Link>
            <Link href="/exams/new" className="px-4 py-2.5 text-sm font-medium text-white bg-spira-700 rounded-lg hover:bg-spira-800 transition-colors">
              + New
            </Link>
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-2/3" />
              <div className="h-3 bg-surface-100 rounded w-1/2" />
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-500 text-sm">No exams found</div>
        ) : (
          data?.data.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-900 truncate">{e.title}</p>
                  <p className="text-sm text-text-500 mt-0.5">
                    <span className="font-mono text-spira-700 text-xs">{e.courseOffering.course.code}</span>
                    {" · "}{e.courseOffering.section.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-text-400 capitalize">{e.examType}</span>
                    <span className="text-xs text-text-400">· {e.maxMarks} marks</span>
                    {e.examDate && <span className="text-xs text-text-400">· {new Date(e.examDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.isPublished ? "bg-success/10 text-success" : "bg-surface-100 text-text-500"}`}>
                      {e.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <Link href={`/exams/${e.id}`} className="text-sm text-spira-700 font-medium shrink-0">View →</Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Exams list">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Title</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Course</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Section</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Type</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Max Marks</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Exam Date</th>
                {!isReadOnly && <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Results</th>}
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
                <th scope="col" className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: isReadOnly ? 8 : 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-16" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? <tr><td colSpan={isReadOnly ? 8 : 9} className="px-4 py-12 text-center text-text-500">No exams found</td></tr>
                  : data?.data.map((e) => (
                    <tr key={e.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-900">{e.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-spira-800">{e.courseOffering.course.code}</td>
                      <td className="px-4 py-3 text-text-500">{e.courseOffering.section.name}</td>
                      <td className="px-4 py-3 text-text-500 capitalize">{e.examType}</td>
                      <td className="px-4 py-3 text-text-500">{e.maxMarks}</td>
                      <td className="px-4 py-3 text-text-500">{e.examDate ? new Date(e.examDate).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "—"}</td>
                      {!isReadOnly && <td className="px-4 py-3 text-text-500">{e._count.results}</td>}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${e.isPublished ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
                          {e.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/exams/${e.id}`} className="text-xs text-spira-700 hover:underline">View</Link>
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
