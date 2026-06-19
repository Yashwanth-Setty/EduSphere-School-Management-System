"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Doc {
  id: string; title: string; category: string; mimeType: string; sizeBytes: number;
  visibilityScope: string; tags: string[]; storageKey: string;
  retentionLabel: string | null; legalHold: boolean;
  createdAt: string; updatedAt: string;
}

const SCOPE_BADGE: Record<string, string> = {
  school_admin: "bg-surface-100 text-text-500",
  section:      "bg-blue-100 text-blue-700",
  student:      "bg-green-100 text-green-700",
  finance:      "bg-yellow-100 text-yellow-700",
  counselor:    "bg-purple-100 text-purple-700",
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: doc, isLoading } = useSWR<Doc>(
    mounted && !!getAccessToken() ? `/documents/${id}` : null,
    (url: string) => apiClient.get<Doc>(url),
  );

  if (isLoading) {
    return <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-5 bg-surface-100 rounded animate-pulse w-48" />)}</div>;
  }
  if (!doc) return <div className="p-6 text-text-500">Document not found.</div>;

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <button onClick={() => router.back()} className="text-xs text-text-400 hover:text-text-700">← Back</button>

      <div>
        <h1 className="text-2xl font-semibold text-text-900">{doc.title}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-text-500 capitalize">{doc.category.replace("_", " ")}</span>
          <span className="text-text-300">·</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SCOPE_BADGE[doc.visibilityScope] ?? ""}`}>
            {doc.visibilityScope.replace("_", " ")}
          </span>
          {doc.legalHold && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Legal Hold</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm divide-y divide-surface-100">
        {[
          ["Storage Key", <span key="sk" className="font-mono text-xs">{doc.storageKey}</span>],
          ["MIME Type", doc.mimeType],
          ["File Size", fmtBytes(doc.sizeBytes)],
          ["Retention Label", doc.retentionLabel ?? "—"],
          ["Added", new Date(doc.createdAt).toLocaleDateString("en-IN", { timeZone: "UTC" })],
          ["Last Updated", new Date(doc.updatedAt).toLocaleDateString("en-IN", { timeZone: "UTC" })],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between items-center px-5 py-3 text-sm">
            <span className="text-text-500">{label}</span>
            <span className="text-text-900">{value}</span>
          </div>
        ))}
      </div>

      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doc.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-spira-500/10 text-spira-800 text-xs">{t}</span>
          ))}
        </div>
      )}

      <div className="pt-1">
        <a
          href={`/api/v1/documents/${doc.id}/download`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors"
        >
          Download
        </a>
      </div>
    </div>
  );
}
