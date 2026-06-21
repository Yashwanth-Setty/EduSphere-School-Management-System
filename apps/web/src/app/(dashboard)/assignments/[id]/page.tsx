"use client";

import { use, useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types";

interface Assignment {
  id: string;
  title: string;
  instructions: string | null;
  dueDate: string;
  maxScore: number | null;
  isPublished: boolean;
  courseOffering: {
    academicTerm: string;
    course: { code: string; name: string };
    section: { name: string };
    teacher: { user: { displayName: string } } | null;
  };
  _count: { submissions: number };
}

interface Submission {
  id: string;
  fileUrl: string | null;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  status: string;
  studentProfile?: { admissionNo: string; firstName: string; lastName: string };
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const isTeacher = (user?.roles ?? []).some((r) => [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(r as Role));
  const isStudent = (user?.roles ?? []).some((r) => r === Role.STUDENT);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();

  const { data: assignment, isLoading } = useSWR<Assignment>(
    hasToken ? `/assignments/${id}` : null,
    (url: string) => apiClient.get<Assignment>(url),
  );

  const { data: submissions, mutate: mutateSubmissions } = useSWR<Submission[]>(
    hasToken && isTeacher ? `/assignments/${id}/submissions` : null,
    (url: string) => apiClient.get<Submission[]>(url),
  );

  const { data: mySubmission, mutate: mutateMySubmission } = useSWR<Submission | null>(
    hasToken && isStudent ? `/assignments/${id}/my-submission` : null,
    (url: string) => apiClient.get<Submission | null>(url),
  );

  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState<string | null>(null);
  const [gradeValues, setGradeValues] = useState<Record<string, { grade: string; feedback: string }>>({});

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post(`/assignments/${id}/submit`, { fileUrl: fileUrl || undefined });
      await mutateMySubmission();
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const vals = gradeValues[submissionId];
    if (!vals) return;
    setGrading(submissionId);
    try {
      await apiClient.patch(`/assignments/${id}/submissions/${submissionId}/grade`, {
        grade: vals.grade ? Number(vals.grade) : undefined,
        feedback: vals.feedback || undefined,
      });
      await mutateSubmissions();
    } finally {
      setGrading(null);
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

  if (!assignment) return <div className="p-4 md:p-6 text-text-500">Assignment not found.</div>;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-spira-800 bg-spira-50 px-2 py-0.5 rounded">
              {assignment.courseOffering.course.code}
            </span>
            <span className="text-text-500 text-xs">{assignment.courseOffering.section.name} · {assignment.courseOffering.academicTerm}</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-900">{assignment.title}</h1>
          <p className="text-text-500 text-sm mt-1">
            Due {new Date(assignment.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}
            {assignment.maxScore !== null && ` · Max score: ${assignment.maxScore}`}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${assignment.isPublished ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
          {assignment.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      {assignment.instructions && (
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text-700 mb-2">Instructions</h2>
          <p className="text-sm text-text-700 whitespace-pre-line">{assignment.instructions}</p>
        </div>
      )}

      {/* Student submission panel */}
      {isStudent && (
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-text-700">My Submission</h2>
          {mySubmission ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  mySubmission.status === "graded" ? "bg-success/10 text-success" :
                  mySubmission.status === "submitted" ? "bg-spira-500/10 text-spira-800" :
                  "bg-text-500/10 text-text-500"
                }`}>{mySubmission.status}</span>
                {mySubmission.submittedAt && (
                  <span className="text-xs text-text-500">
                    Submitted {new Date(mySubmission.submittedAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                  </span>
                )}
              </div>
              {mySubmission.fileUrl && (
                <p className="text-sm text-text-700">
                  File: <a href={mySubmission.fileUrl} className="text-spira-700 hover:underline" target="_blank" rel="noopener noreferrer">{mySubmission.fileUrl}</a>
                </p>
              )}
              {mySubmission.grade !== null && (
                <p className="text-sm font-medium text-text-900">
                  Grade: {mySubmission.grade}{assignment.maxScore !== null ? ` / ${assignment.maxScore}` : ""}
                </p>
              )}
              {mySubmission.feedback && (
                <div className="bg-surface-50 border border-surface-100 rounded p-3 text-sm text-text-700">
                  <span className="font-medium">Feedback: </span>{mySubmission.feedback}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-500">No submission yet.</p>
              {assignment.isPublished && (
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="File URL (optional)"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Teacher submissions table */}
      {isTeacher && (
        <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100">
            <h2 className="text-sm font-semibold text-text-700">Submissions ({assignment._count.submissions})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Grade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-500 uppercase tracking-wide">Feedback</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {!submissions || submissions.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-10 text-center text-text-500">No submissions yet</td></tr>
                  : submissions.map((s) => (
                    <tr key={s.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-900">
                        {s.studentProfile ? `${s.studentProfile.firstName} ${s.studentProfile.lastName}` : "—"}
                        <div className="text-xs text-text-500">{s.studentProfile?.admissionNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === "graded" ? "bg-success/10 text-success" :
                          s.status === "submitted" ? "bg-spira-500/10 text-spira-800" :
                          "bg-text-500/10 text-text-500"
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-text-500 text-xs">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={assignment.maxScore ?? undefined}
                          defaultValue={s.grade ?? ""}
                          onChange={(e) => setGradeValues((v) => ({ ...v, [s.id]: { ...v[s.id], grade: e.target.value } }))}
                          className="w-20 px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-spira-700"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          defaultValue={s.feedback ?? ""}
                          onChange={(e) => setGradeValues((v) => ({ ...v, [s.id]: { ...v[s.id], feedback: e.target.value } }))}
                          className="w-40 px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-spira-700"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleGrade(s.id)}
                          disabled={grading === s.id}
                          className="px-3 py-1 text-xs font-medium text-white bg-spira-700 rounded hover:bg-spira-800 disabled:opacity-50 transition-colors"
                        >
                          {grading === s.id ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
