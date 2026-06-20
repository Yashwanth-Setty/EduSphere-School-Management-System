"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const CATEGORIES = ["policy", "circular", "report_card", "finance", "counselor", "general"];
const SCOPES = [
  { value: "school_admin", label: "Admin / Principal only" },
  { value: "section",      label: "Teachers + Admin" },
  { value: "student",      label: "Students + Parents + Teachers + Admin" },
  { value: "finance",      label: "Finance / Accountant" },
  { value: "counselor",    label: "Counselor" },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [scope, setScope] = useState("school_admin");
  const [mimeType, setMimeType] = useState("application/pdf");
  const [sizeBytes, setSizeBytes] = useState("");
  const [storageKey, setStorageKey] = useState("");
  const [tags, setTags] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title || !storageKey || !sizeBytes) { setError("Title, storage key and size are required."); return; }
    setSaving(true);
    try {
      const doc = await apiClient.post<{ id: string }>("/documents", {
        title,
        category,
        visibilityScope: scope,
        mimeType,
        sizeBytes: Number(sizeBytes),
        storageKey,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      router.push(`/documents/${doc.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-900">Upload Document</h1>
        <p className="text-text-500 text-sm mt-0.5">Register a document in the system</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border shadow-sm p-6 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Student Code of Conduct 2026"
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Visibility</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500">
              {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Storage Key / File Path</label>
          <input value={storageKey} onChange={(e) => setStorageKey(e.target.value)}
            placeholder="docs/policy/code-of-conduct.pdf"
            className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-spira-500" />
          <p className="text-xs text-text-400 mt-1">Simulated path â€” replace with real storage URL in production</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">MIME Type</label>
            <input value={mimeType} onChange={(e) => setMimeType(e.target.value)} placeholder="application/pdf"
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Size (bytes)</label>
            <input type="number" min={0} value={sizeBytes} onChange={(e) => setSizeBytes(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Tags (comma-separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="2026, term1, grade8"
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors">
            {saving ? "Savingâ€¦" : "Save Document"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-md hover:bg-surface-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

