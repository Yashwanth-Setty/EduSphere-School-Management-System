"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";

interface Announcement {
  id: string; title: string; body: string;
  audienceScope: string; channel: string;
  isPublished: boolean; publishedAt: string | null;
  expiresAt: string | null; createdAt: string; updatedAt: string;
}

const SCOPE_STYLE: Record<string, string> = {
  school:   "bg-spira-500/10 text-spira-800",
  students: "bg-green-100 text-green-700",
  parents:  "bg-blue-100 text-blue-700",
  teachers: "bg-yellow-100 text-yellow-700",
  section:  "bg-purple-100 text-purple-700",
};

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const key = mounted && !!getAccessToken() ? `/announcements/${id}` : null;
  const { data: ann, isLoading } = useSWR<Announcement>(key, (url: string) => apiClient.get<Announcement>(url));

  const canEdit = (user?.roles ?? []).some((r) => [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(r as Role));
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    setPublishing(true);
    try {
      await apiClient.patch(`/announcements/${id}`, { isPublished: true });
      mutate(key);
    } finally {
      setPublishing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-5 bg-surface-100 rounded animate-pulse w-2/3" />)}
      </div>
    );
  }
  if (!ann) return <div className="p-4 md:p-6 text-text-500">Announcement not found.</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-5">
      <button onClick={() => router.back()} className="text-xs text-text-400 hover:text-text-700">← Back</button>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SCOPE_STYLE[ann.audienceScope] ?? "bg-surface-100 text-text-500"}`}>
                {ann.audienceScope}
              </span>
              <span className="text-xs text-text-400 capitalize">{ann.channel.replace("_", " ")}</span>
              {!ann.isPublished && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Draft</span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-text-900">{ann.title}</h1>
          </div>
          {canEdit && !ann.isPublished && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="shrink-0 px-4 py-1.5 text-xs font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>

        <p className="text-text-700 text-sm leading-relaxed whitespace-pre-wrap">{ann.body}</p>

        <div className="border-t border-surface-100 pt-3 flex flex-wrap gap-4 text-xs text-text-400">
          {ann.publishedAt && (
            <span>Published: {new Date(ann.publishedAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}</span>
          )}
          {ann.expiresAt && (
            <span>Expires: {new Date(ann.expiresAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}</span>
          )}
          <span>Created: {new Date(ann.createdAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}</span>
        </div>
      </div>
    </div>
  );
}
