"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { canCreate, canSubmitAssignment } from "@/lib/permissions";

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  maxScore: number | null;
  isPublished: boolean;
  _count: { submissions: number };
  courseOffering: {
    academicTerm: string;
    course: { code: string; name: string };
    section: { name: string };
  };
}

interface Paged { data: Assignment[]; total: number; page: number; totalPages: number }

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user?.roles ?? []) as Role[];
  const isStudent = canSubmitAssignment(roles);
  const canNew = canCreate(roles, "assignments");

  const { data, isLoading } = useSWR<Paged>(
    mounted && !!getAccessToken() ? `/assignments?page=${page}&pageSize=20` : null,
    (url: string) => apiClient.get<Paged>(url),
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Assignments</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} assignments</p>
        </div>
        {canNew && (
          <Link href="/assignments/new" className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors">
            + New assignment
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Assignments list">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Title</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Course</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Section</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Due</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Max Score</th>
                {!isStudent && (
                  <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Submissions</th>
                )}
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
                <th scope="col" className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: isStudent ? 7 : 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? <tr><td colSpan={isStudent ? 7 : 8} className="px-4 py-12 text-center text-text-500">No assignments found</td></tr>
                  : data?.data.map((a) => (
                    <tr key={a.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-900">{a.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-spira-800">{a.courseOffering.course.code}</td>
                      <td className="px-4 py-3 text-text-500">{a.courseOffering.section.name}</td>
                      <td className="px-4 py-3 text-text-500">{new Date(a.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</td>
                      <td className="px-4 py-3 text-text-500">{a.maxScore ?? "—"}</td>
                      {!isStudent && (
                        <td className="px-4 py-3 text-text-500">{a._count.submissions}</td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.isPublished ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
                          {a.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/assignments/${a.id}`} className="text-xs text-spira-700 hover:underline">
                          {isStudent ? "Submit" : "View"}
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
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Previous</button>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
