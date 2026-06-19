"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export default function NewAssignmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    courseOfferingId: "",
    title: "",
    instructions: "",
    dueDate: "",
    maxScore: "",
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/assignments", {
        courseOfferingId: form.courseOfferingId,
        title: form.title,
        instructions: form.instructions || undefined,
        dueDate: form.dueDate,
        maxScore: form.maxScore ? Number(form.maxScore) : undefined,
        isPublished: form.isPublished,
      });
      router.push("/assignments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold text-text-900 mb-6">New Assignment</h1>
      {error && <div className="mb-4 px-4 py-3 bg-error/10 text-error rounded-md text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-border rounded-lg p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Course Offering ID</label>
          <input
            type="text"
            required
            value={form.courseOfferingId}
            onChange={(e) => setForm({ ...form, courseOfferingId: e.target.value })}
            placeholder="Paste a course offering ID from Courses page"
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Instructions</label>
          <textarea
            rows={4}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Due Date</label>
            <input
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Max Score</label>
            <input
              type="number"
              min="0"
              value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="publish"
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            className="rounded border-border"
          />
          <label htmlFor="publish" className="text-sm text-text-700">Publish immediately</label>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating…" : "Create Assignment"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 text-sm font-medium text-text-700 border border-border rounded-md hover:bg-surface-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
