"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useEffect } from "react";

interface Section {
  id: string;
  name: string;
}

export default function NewAttendanceSessionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ sectionId: "", sessionDate: today, periodNumber: 1 });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: sections } = useSWR<Section[]>(
    mounted && !!getAccessToken() ? "/timetable/sections" : null,
    (url: string) => apiClient.get<Section[]>(url),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const session = await apiClient.post<{ id: string }>("/attendance/sessions", {
        sectionId: form.sectionId,
        sessionDate: form.sessionDate,
        periodNumber: Number(form.periodNumber),
      });
      router.push(`/attendance/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg">
      <div className="mb-6">
        <Link href="/attendance" className="text-sm text-spira-700 hover:underline">&larr; Back to attendance</Link>
        <h1 className="text-2xl font-semibold text-text-900 mt-2">Open attendance session</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-5">
        {error && (
          <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</div>
        )}

        <div>
          <label htmlFor="section" className="block text-sm font-medium text-text-700 mb-1">Section <span aria-hidden>*</span></label>
          <select
            id="section"
            required
            value={form.sectionId}
            onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white"
          >
            <option value="">â€” Choose section â€”</option>
            {(sections ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-text-700 mb-1">Date <span aria-hidden>*</span></label>
          <input
            id="date"
            type="date"
            required
            value={form.sessionDate}
            onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
          />
        </div>

        <div>
          <label htmlFor="period" className="block text-sm font-medium text-text-700 mb-1">Period <span aria-hidden>*</span></label>
          <input
            id="period"
            type="number"
            required
            min={1}
            max={10}
            value={form.periodNumber}
            onChange={(e) => setForm((f) => ({ ...f, periodNumber: Number(e.target.value) }))}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors disabled:opacity-60"
          >
            {saving ? "Openingâ€¦" : "Open session"}
          </button>
          <Link href="/attendance" className="text-sm text-text-500 hover:text-text-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

