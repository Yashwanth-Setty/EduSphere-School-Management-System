"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface GradeLevel { id: string; name: string }
interface GradeScale {
  id: string;
  gradeLabel: string;
  minPercent: number;
  maxPercent: number;
  gradePoint: number | null;
  description: string | null;
  gradeLevel: { name: string };
}

export default function GradeScalesPage() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    gradeLevelId: "",
    gradeLabel: "",
    minPercent: "",
    maxPercent: "",
    gradePoint: "",
    description: "",
  });

  useEffect(() => { setMounted(true); }, []);
  const hasToken = mounted && !!getAccessToken();

  const { data: scales, mutate } = useSWR<GradeScale[]>(
    hasToken ? "/grade-scales" : null,
    (url: string) => apiClient.get<GradeScale[]>(url),
  );

  const { data: levels } = useSWR<GradeLevel[]>(
    hasToken ? "/grade-scales/grade-levels" : null,
    (url: string) => apiClient.get<GradeLevel[]>(url),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/grade-scales", {
        gradeLevelId: form.gradeLevelId,
        gradeLabel: form.gradeLabel,
        minPercent: Number(form.minPercent),
        maxPercent: Number(form.maxPercent),
        gradePoint: form.gradePoint ? Number(form.gradePoint) : undefined,
        description: form.description || undefined,
      });
      setForm({ gradeLevelId: "", gradeLabel: "", minPercent: "", maxPercent: "", gradePoint: "", description: "" });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create grade scale");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this grade scale entry?")) return;
    await apiClient.delete(`/grade-scales/${id}`);
    await mutate();
  };

  const byLevel = (scales ?? []).reduce<Record<string, GradeScale[]>>((acc, s) => {
    const k = s.gradeLevel.name;
    acc[k] = [...(acc[k] ?? []), s];
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-900">Grade Scales</h1>
        <p className="text-text-500 text-sm mt-0.5">Define grading bands per grade level</p>
      </div>

      {/* Create form */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-text-700 mb-4">Add Grade Scale Entry</h2>
        {error && <div className="mb-3 px-3 py-2 bg-error/10 text-error rounded text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-text-700 mb-1">Grade Level</label>
            <select
              required
              value={form.gradeLevelId}
              onChange={(e) => setForm({ ...form, gradeLevelId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
            >
              <option value="">Selectâ€¦</option>
              {levels?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">Label</label>
            <input required type="text" placeholder="A+" value={form.gradeLabel} onChange={(e) => setForm({ ...form, gradeLabel: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">Min %</label>
            <input required type="number" min="0" max="100" value={form.minPercent} onChange={(e) => setForm({ ...form, minPercent: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">Max %</label>
            <input required type="number" min="0" max="100" value={form.maxPercent} onChange={(e) => setForm({ ...form, maxPercent: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">Grade Point</label>
            <input type="number" min="0" step="0.1" value={form.gradePoint} onChange={(e) => setForm({ ...form, gradePoint: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">Description</label>
            <input type="text" placeholder="Outstanding" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700" />
          </div>
          <div className="col-span-2 sm:col-span-3 flex justify-end">
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors">
              {saving ? "Addingâ€¦" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>

      {/* Grade scales table by level */}
      {Object.entries(byLevel).map(([levelName, entries]) => (
        <div key={levelName} className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-100 bg-surface-50">
            <h2 className="text-sm font-semibold text-text-700">{levelName}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-4 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Label</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Range</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">GPA</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((s) => (
                <tr key={s.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-text-900">{s.gradeLabel}</td>
                  <td className="px-4 py-2.5 text-text-500">{s.minPercent}% â€“ {s.maxPercent}%</td>
                  <td className="px-4 py-2.5 text-text-500">{s.gradePoint ?? "â€”"}</td>
                  <td className="px-4 py-2.5 text-text-500">{s.description ?? "â€”"}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-error hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {mounted && (!scales || scales.length === 0) && (
        <div className="text-center py-10 text-text-500 text-sm">No grade scales defined yet.</div>
      )}
    </div>
  );
}

