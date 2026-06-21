"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types";
import { canCreate } from "@/lib/permissions";

interface Doc {
  id: string;
  title: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  visibilityScope: string;
  tags: string[];
  storageKey: string;
  createdAt: string;
}

interface Paged { data: Doc[]; total: number; page: number; totalPages: number }

const SCOPE_BADGE: Record<string, string> = {
  school_admin: "bg-surface-100 text-text-500",
  section:      "bg-blue-100 text-blue-700",
  student:      "bg-green-100 text-green-700",
  finance:      "bg-yellow-100 text-yellow-700",
  counselor:    "bg-purple-100 text-purple-700",
};

const CAT_ICON: Record<string, string> = {
  textbook:       "ðŸ“š",
  notes:          "ðŸ““",
  question_paper: "ðŸ“",
  circular:       "ðŸ“¢",
  report_card:    "ðŸ…",
  policy:         "ðŸ“‹",
  finance:        "ðŸ’°",
  counselor:      "ðŸ§ ",
  general:        "ðŸ“„",
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user?.roles ?? []) as Role[];
  const canWrite = canCreate(roles, "documents");

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (category) params.set("category", category);
  if (search) params.set("search", search);

  const { data, isLoading } = useSWR<Paged>(
    mounted && !!getAccessToken() ? `/documents?${params}` : null,
    (url: string) => apiClient.get<Paged>(url),
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Documents</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} documents</p>
        </div>
        {canWrite && (
          <Link href="/documents/new" className="px-4 py-2.5 text-sm font-medium text-white bg-spira-700 rounded-lg hover:bg-spira-800 transition-colors">
            + Upload
          </Link>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "",               label: "All",           icon: "ðŸ“" },
          { value: "textbook",       label: "Textbooks",     icon: "ðŸ“š" },
          { value: "notes",          label: "Notes",         icon: "ðŸ““" },
          { value: "question_paper", label: "Question Papers",icon: "ðŸ“" },
          { value: "circular",       label: "Circulars",     icon: "ðŸ“¢" },
          { value: "report_card",    label: "Report Cards",  icon: "ðŸ…" },
          { value: "policy",         label: "Policies",      icon: "ðŸ“‹" },
          { value: "general",        label: "General",       icon: "ðŸ“„" },
        ].map((c) => (
          <button
            key={c.value}
            onClick={() => { setCategory(c.value); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-colors flex items-center gap-1 ${category === c.value ? "bg-spira-700 text-white border-spira-700" : "border-border text-text-600 bg-white"}`}
          >
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        className="flex gap-2"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search documentsâ€¦"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500 bg-white"
        />
        <button type="submit" className="px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-surface-50">
          Search
        </button>
      </form>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-2/3" />
              <div className="h-3 bg-surface-100 rounded w-1/3" />
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-500 text-sm">No documents found</div>
        ) : (
          data?.data.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{CAT_ICON[doc.category] ?? "ðŸ“„"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-text-500 capitalize">{doc.category.replace("_", " ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCOPE_BADGE[doc.visibilityScope] ?? "bg-surface-100 text-text-500"}`}>
                      {doc.visibilityScope.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-text-400">{fmtBytes(doc.sizeBytes)}</span>
                    <span className="text-xs text-text-400">{new Date(doc.createdAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}</span>
                  </div>
                </div>
                <Link href={`/documents/${doc.id}`} className="text-sm text-spira-700 font-medium shrink-0">View â†’</Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm" role="grid" aria-label="Documents">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Title</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Category</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Visibility</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Size</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Added</th>
              <th scope="col" className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-20" /></td>
                  ))}
                </tr>
              ))
              : data?.data.length === 0
                ? <tr><td colSpan={6} className="px-4 py-12 text-center text-text-500">No documents found</td></tr>
                : data?.data.map((doc) => (
                  <tr key={doc.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-900 max-w-xs truncate">{doc.title}</td>
                    <td className="px-4 py-3 text-text-500 capitalize">{doc.category.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SCOPE_BADGE[doc.visibilityScope] ?? "bg-surface-100 text-text-500"}`}>
                        {doc.visibilityScope.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-400 text-xs">{fmtBytes(doc.sizeBytes)}</td>
                    <td className="px-4 py-3 text-text-400 text-xs">{new Date(doc.createdAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}</td>
                    <td className="px-4 py-3">
                      <Link href={`/documents/${doc.id}`} className="text-xs text-spira-700 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
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
