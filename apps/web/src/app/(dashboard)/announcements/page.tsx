"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { canCreate } from "@/lib/permissions";

interface Announcement {
  id: string; title: string; body: string;
  audienceScope: string; channel: string;
  isPublished: boolean; publishedAt: string | null;
  expiresAt: string | null; createdAt: string;
}

interface Paged { data: Announcement[]; total: number; page: number; totalPages: number }

const SCOPE_STYLE: Record<string, string> = {
  school:   "bg-spira-500/10 text-spira-800",
  students: "bg-green-100 text-green-700",
  parents:  "bg-blue-100 text-blue-700",
  teachers: "bg-yellow-100 text-yellow-700",
  section:  "bg-purple-100 text-purple-700",
};

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [showDrafts, setShowDrafts] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user?.roles ?? []) as Role[];
  const userCanCreate = canCreate(roles, "announcements");
  const canSeeDrafts = userCanCreate;

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (showDrafts) params.set("includeUnpublished", "true");

  const { data, isLoading } = useSWR<Paged>(
    mounted && !!getAccessToken() ? `/announcements?${params}` : null,
    (url: string) => apiClient.get<Paged>(url),
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Announcements</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} announcements</p>
        </div>
        <div className="flex items-center gap-3">
          {canSeeDrafts && (
            <label className="flex items-center gap-2 text-sm text-text-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showDrafts}
                onChange={(e) => { setShowDrafts(e.target.checked); setPage(1); }}
                className="rounded border-border"
              />
              Show drafts
            </label>
          )}
          {userCanCreate && (
            <Link
              href="/announcements/new"
              className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors"
            >
              + New Announcement
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-border p-5 animate-pulse space-y-2">
              <div className="h-5 bg-surface-100 rounded w-1/2" />
              <div className="h-3 bg-surface-100 rounded w-3/4" />
            </div>
          ))
          : data?.data.length === 0
            ? (
              <div className="bg-white rounded-lg border border-border p-12 text-center text-text-500">
                No announcements yet.
              </div>
            )
            : data?.data.map((ann) => (
              <Link
                key={ann.id}
                href={`/announcements/${ann.id}`}
                className="block bg-white rounded-lg border border-border shadow-sm p-5 hover:border-spira-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SCOPE_STYLE[ann.audienceScope] ?? "bg-surface-100 text-text-500"}`}>
                        {ann.audienceScope}
                      </span>
                      {!ann.isPublished && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <h2 className="font-semibold text-text-900 truncate">{ann.title}</h2>
                    <p className="text-text-500 text-sm mt-1 line-clamp-2">{ann.body}</p>
                  </div>
                  <span className="text-xs text-text-400 shrink-0">
                    {ann.publishedAt
                      ? new Date(ann.publishedAt).toLocaleDateString("en-IN", { timeZone: "UTC" })
                      : new Date(ann.createdAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                  </span>
                </div>
              </Link>
            ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-500">Page {data.page} of {data.totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Previous</button>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-surface-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
