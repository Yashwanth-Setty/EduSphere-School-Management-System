"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export default function NewExamPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    courseOfferingId: "",
    academicYearId: "",
    title: "",
    examType: "midterm",
    term: "term_1",
    maxMarks: "100",
    weight: "1",
    examDate: "",
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/exams", {
        courseOfferingId: form.courseOfferingId,
        academicYearId: form.academicYearId,
        title: form.title,
        examType: form.examType,
        term: form.term,
        maxMarks: Number(form.maxMarks),
        weight: Number(form.weight),
        examDate: form.examDate || undefined,
        isPublished: form.isPublished,
      });
      router.push("/exams");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = "text", opts?: { options?: string[]; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-text-700 mb-1">{label}</label>
      {opts?.options ? (
        <select
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
        >
          {opts.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={opts?.placeholder}
          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
        />
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold text-text-900 mb-6">New Exam</h1>
      {error && <div className="mb-4 px-4 py-3 bg-error/10 text-error rounded-md text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-border rounded-lg p-6 shadow-sm">
        {field("Course Offering ID", "courseOfferingId", "text", { placeholder: "Paste offering ID from Courses page" })}
        {field("Academic Year ID", "academicYearId", "text", { placeholder: "Paste academic year ID" })}
        {field("Title", "title")}
        {field("Exam Type", "examType", "text", { options: ["midterm", "final", "unit", "practical"] })}
        {field("Term", "term", "text", { options: ["term_1", "term_2", "term_3"] })}
        <div className="grid grid-cols-2 gap-4">
          {field("Max Marks", "maxMarks", "number")}
          {field("Weight", "weight", "number")}
        </div>
        {field("Exam Date", "examDate", "datetime-local")}
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
            {saving ? "Creating…" : "Create Exam"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-5 py-2 text-sm font-medium text-text-700 border border-border rounded-md hover:bg-surface-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
