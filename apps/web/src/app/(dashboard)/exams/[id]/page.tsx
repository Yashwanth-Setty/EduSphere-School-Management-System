"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";

interface Exam {
  id: string;
  title: string;
  examType: string;
  term: string;
  maxMarks: number;
  weight: number;
  examDate: string | null;
  isPublished: boolean;
  courseOffering: {
    academicTerm: string;
    course: { code: string; name: string };
    section: { name: string };
    teacher: { user: { displayName: string } } | null;
  };
  _count: { results: number };
}

interface ExamResult {
  id: string;
  studentProfileId: string;
  marksObtained: number | null;
  grade: string | null;
  remarks: string | null;
  studentProfile: { admissionNo: string; firstName: string; lastName: string };
}

interface MyResult {
  id: string;
  marksObtained: number | null;
  grade: string | null;
  remarks: string | null;
}

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const isTeacher = (user?.roles ?? []).some((r) => [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(r as Role));
  const isStudent = (user?.roles ?? []).some((r) => r === Role.STUDENT);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();

  const { data: exam, isLoading } = useSWR<Exam>(
    hasToken ? `/exams/${id}` : null,
    (url: string) => apiClient.get<Exam>(url),
  );

  const { data: results, mutate: mutateResults } = useSWR<ExamResult[]>(
    hasToken && isTeacher ? `/exams/${id}/results` : null,
    (url: string) => apiClient.get<ExamResult[]>(url),
  );

  const { data: myResult } = useSWR<MyResult | null>(
    hasToken && isStudent ? `/exams/${id}/my-result` : null,
    (url: string) => apiClient.get<MyResult | null>(url),
  );

  const [resultEdits, setResultEdits] = useState<Record<string, { marks: string; grade: string; remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(resultEdits)
        .map(([studentProfileId, v]) => ({
          studentProfileId,
          marksObtained: v.marks ? Number(v.marks) : undefined,
          grade: v.grade || undefined,
          remarks: v.remarks || undefined,
        }));
      if (payload.length > 0) {
        await apiClient.post(`/exams/${id}/results`, { results: payload });
        await mutateResults();
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !mounted) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-8 bg-surface-100 rounded animate-pulse w-64" />
        <div className="h-4 bg-surface-100 rounded animate-pulse w-96" />
      </div>
    );
  }

  if (!exam) return <div className="p-4 md:p-6 text-text-500">Exam not found.</div>;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-spira-800 bg-spira-50 px-2 py-0.5 rounded">
              {exam.courseOffering.course.code}
            </span>
            <span className="text-text-500 text-xs capitalize">{exam.examType} · {exam.courseOffering.section.name} · {exam.term}</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-900">{exam.title}</h1>
          <p className="text-text-500 text-sm mt-1">
            Max marks: {exam.maxMarks} · Weight: {exam.weight}
            {exam.examDate && ` · ${new Date(exam.examDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}`}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${exam.isPublished ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
          {exam.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      {/* Student view */}
      {isStudent && (
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text-700 mb-3">My Result</h2>
          {myResult ? (
            <div className="space-y-2">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-text-500">Marks Obtained</p>
                  <p className="text-2xl font-bold text-text-900">
                    {myResult.marksObtained ?? "—"}
                    <span className="text-sm font-normal text-text-500"> / {exam.maxMarks}</span>
                  </p>
                </div>
                {myResult.grade && (
                  <div>
                    <p className="text-xs text-text-500">Grade</p>
                    <p className="text-2xl font-bold text-spira-800">{myResult.grade}</p>
                  </div>
                )}
                {myResult.marksObtained !== null && (
                  <div>
                    <p className="text-xs text-text-500">Percentage</p>
                    <p className="text-2xl font-bold text-text-900">
                      {((myResult.marksObtained / exam.maxMarks) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              {myResult.remarks && (
                <div className="bg-surface-50 border border-surface-100 rounded p-3 text-sm text-text-700">
                  <span className="font-medium">Remarks: </span>{myResult.remarks}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-500">Results not yet published for this exam.</p>
          )}
        </div>
      )}

      {/* Teacher results entry */}
      {isTeacher && (
        <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-700">Results Entry ({exam._count.results} entered)</h2>
            <button
              onClick={handleSaveResults}
              disabled={saving || Object.keys(resultEdits).length === 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save all changes"}
            </button>
          </div>
          {!results || results.length === 0 ? (
            <div className="px-5 py-10 text-center text-text-500 text-sm">
              No results yet. Add students to this section first, then enter marks below.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Marks / {exam.maxMarks}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">%</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Grade</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const edit = resultEdits[r.studentProfileId] ?? { marks: "", grade: "", remarks: "" };
                    const marks = edit.marks !== "" ? Number(edit.marks) : r.marksObtained;
                    const pct = marks !== null && marks !== undefined ? ((marks / exam.maxMarks) * 100).toFixed(1) : "—";
                    return (
                      <tr key={r.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-text-900">
                          {r.studentProfile.firstName} {r.studentProfile.lastName}
                          <div className="text-xs text-text-500">{r.studentProfileId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={exam.maxMarks}
                            defaultValue={r.marksObtained ?? ""}
                            onChange={(e) => setResultEdits((v) => ({
                              ...v,
                              [r.studentProfileId]: { ...v[r.studentProfileId] ?? { grade: "", remarks: "" }, marks: e.target.value },
                            }))}
                            className="w-20 px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-spira-700"
                          />
                        </td>
                        <td className="px-4 py-3 text-text-500 text-xs">{pct}{pct !== "—" ? "%" : ""}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            defaultValue={r.grade ?? ""}
                            onChange={(e) => setResultEdits((v) => ({
                              ...v,
                              [r.studentProfileId]: { ...v[r.studentProfileId] ?? { marks: "", remarks: "" }, grade: e.target.value },
                            }))}
                            className="w-16 px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-spira-700"
                            placeholder="A+"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            defaultValue={r.remarks ?? ""}
                            onChange={(e) => setResultEdits((v) => ({
                              ...v,
                              [r.studentProfileId]: { ...v[r.studentProfileId] ?? { marks: "", grade: "" }, remarks: e.target.value },
                            }))}
                            className="w-48 px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-spira-700"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
