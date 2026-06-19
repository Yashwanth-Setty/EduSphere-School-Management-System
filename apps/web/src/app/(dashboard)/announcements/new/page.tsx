"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const SCOPES = ["school", "students", "parents", "teachers", "section"];

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceScope, setAudienceScope] = useState("school");
  const [channel, setChannel] = useState("in_app");
  const [publish, setPublish] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title || !body) { setError("Title and body are required."); return; }
    setSaving(true);
    try {
      const ann = await apiClient.post<{ id: string }>("/announcements", {
        title,
        body,
        audienceScope,
        channel,
        isPublished: publish,
        expiresAt: expiresAt || undefined,
      });
      router.push(`/announcements/${ann.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create announcement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-900">New Announcement</h1>
        <p className="text-text-500 text-sm mt-0.5">Publish to students, parents, teachers, or the whole school</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border shadow-sm p-6 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Welcome to Term 1!"
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6}
            placeholder="Write your announcement here…"
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500 resize-y" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Audience</label>
            <select value={audienceScope} onChange={(e) => setAudienceScope(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500">
              {SCOPES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500">
              <option value="in_app">In-app</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Expires at (optional)</label>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500" />
        </div>

        <label className="flex items-center gap-2 text-sm text-text-700 cursor-pointer">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="rounded border-border" />
          Publish immediately
        </label>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : publish ? "Publish" : "Save as Draft"}
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
