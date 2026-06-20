"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/courses", form);
      router.push("/courses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <div className="mb-6">
        <Link href="/courses" className="text-sm text-spira-700 hover:underline">&larr; Back to courses</Link>
        <h1 className="text-2xl font-semibold text-text-900 mt-2">New course</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-5">
        {error && (
          <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-text-700 mb-1">
            Course code <span aria-hidden>*</span>
          </label>
          <input
            id="code"
            type="text"
            required
            placeholder="e.g. MATH-9"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-700 mb-1">
            Course name <span aria-hidden>*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="e.g. Mathematics Grade 9"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Optional course description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors disabled:opacity-60"
          >
            {saving ? "Creatingâ€¦" : "Create course"}
          </button>
          <Link href="/courses" className="text-sm text-text-500 hover:text-text-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

