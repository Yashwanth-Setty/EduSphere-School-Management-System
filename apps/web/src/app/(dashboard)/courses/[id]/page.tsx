"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Offering {
  id: string;
  academicTerm: string;
  section: { name: string };
  teacher?: { user: { displayName: string } };
}

interface CourseDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  offerings: Offering[];
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: course, isLoading } = useSWR<CourseDetail>(
    mounted && !!getAccessToken() ? `/courses/${id}` : null,
    (url: string) => apiClient.get<CourseDetail>(url),
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-6 bg-surface-100 rounded animate-pulse w-48" />
        <div className="h-32 bg-surface-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-3xl">
      <div>
        <Link href="/courses" className="text-sm text-spira-700 hover:underline">&larr; Back to courses</Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-text-900">{course.name}</h1>
            <p className="text-sm text-text-500 mt-0.5 font-mono">{course.code}</p>
          </div>
          <span className={`mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${course.isActive ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
            {course.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        {course.description && (
          <p className="mt-3 text-sm text-text-600">{course.description}</p>
        )}
      </div>

      {/* Offerings */}
      <div className="bg-white rounded-lg border border-border">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-900">Section offerings ({course.offerings.length})</h2>
        </div>
        {course.offerings.length === 0 ? (
          <p className="px-5 py-8 text-sm text-text-500 text-center">No offerings yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left px-5 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Section</th>
                <th className="text-left px-5 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Term</th>
                <th className="text-left px-5 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {course.offerings.map((o) => (
                <tr key={o.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50">
                  <td className="px-5 py-3 text-text-900 font-medium">{o.section.name}</td>
                  <td className="px-5 py-3 text-text-500 capitalize">{o.academicTerm.replace("_", " ")}</td>
                  <td className="px-5 py-3 text-text-500">{o.teacher?.user.displayName ?? "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
