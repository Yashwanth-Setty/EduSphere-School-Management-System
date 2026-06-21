"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types";
import { canCreate } from "@/lib/permissions";

interface Exam {
  id: string;
  title: string;
  examType: string;
  term: string;
  maxMarks: number;
  examDate: string | null;
  isPublished: boolean;
  _count: { results: number };
  courseOffering: {
    academicTerm: string;
    course: { code: string; name: string };
    section: { name: string };
  };
}

interface Paged { data: Exam[]; total: number; page: number; totalPages: number }

interface Doc {
  id: string;
  title: string;
  category: string;
  storageKey: string;
}

// Simulated student results per subject for dashboard view
const SUBJECT_RESULTS = [
  { subject: "Mathematics",   code: "MATH-8", marks: 44, max: 50, grade: "A",  color: "#6366f1", tests: [{ name: "Unit 1", marks: 18, max: 20 }, { name: "Unit 2", marks: 16, max: 20 }, { name: "Mid-term", marks: 44, max: 50 }] },
  { subject: "Science",       code: "SCI-8",  marks: 38, max: 50, grade: "B+", color: "#22c55e", tests: [{ name: "Unit 1", marks: 17, max: 20 }, { name: "Unit 2", marks: 14, max: 20 }, { name: "Mid-term", marks: 38, max: 50 }] },
  { subject: "English",       code: "ENG-8",  marks: 46, max: 50, grade: "A+", color: "#f59e0b", tests: [{ name: "Unit 1", marks: 19, max: 20 }, { name: "Unit 2", marks: 18, max: 20 }, { name: "Mid-term", marks: 46, max: 50 }] },
  { subject: "Social Studies",code: "SOC-8",  marks: 41, max: 50, grade: "A",  color: "#ec4899", tests: [{ name: "Unit 1", marks: 16, max: 20 }, { name: "Unit 2", marks: 17, max: 20 }, { name: "Mid-term", marks: 41, max: 50 }] },
];

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  "A":  "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  "B":  "bg-sky-100 text-sky-700",
  "C":  "bg-yellow-100 text-yellow-700",
};

export default function ExamsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roles = (user?.roles ?? []) as Role[];
  const canNew = canCreate(roles, "exams");
  const isStudent = roles.includes(Role.STUDENT);
  const isStudentOrParent = isStudent || roles.includes(Role.PARENT);

  const { data, isLoading } = useSWR<Paged>(
    mounted && !!getAccessToken() ? `/exams?page=${page}&pageSize=20` : null,
    (url: string) => apiClient.get<Paged>(url),
  );

  const { data: docsData } = useSWR<{ data: Doc[] }>(
    mounted && !!getAccessToken() && isStudentOrParent ? "/documents?category=question_paper&pageSize=10" : null,
    (url: string) => apiClient.get<{ data: Doc[] }>(url),
  );

  if (isStudentOrParent) {
    return <StudentDashboard exams={data?.data ?? []} questionPapers={docsData?.data ?? []} isLoading={isLoading} />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Exams & Results</h1>
          <p className="text-text-500 text-sm mt-0.5">{data?.total ?? 0} exams</p>
        </div>
        {canNew && (
          <div className="flex items-center gap-2">
            <Link href="/grade-scales" className="px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-lg hover:bg-surface-50 transition-colors hidden md:inline-flex">
              Grade Scales
            </Link>
            <Link href="/exams/new" className="px-4 py-2.5 text-sm font-medium text-white bg-spira-700 rounded-lg hover:bg-spira-800 transition-colors">
              + New
            </Link>
          </div>
        )}
      </div>

      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-2/3" />
              <div className="h-3 bg-surface-100 rounded w-1/2" />
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-500 text-sm">No exams found</div>
        ) : (
          data?.data.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-900 truncate">{e.title}</p>
                  <p className="text-sm text-text-500 mt-0.5">
                    <span className="font-mono text-spira-700 text-xs">{e.courseOffering.course.code}</span>
                    {" Â· "}{e.courseOffering.section.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-text-400 capitalize">{e.examType}</span>
                    <span className="text-xs text-text-400">Â· {e.maxMarks} marks</span>
                    {e.examDate && <span className="text-xs text-text-400">Â· {new Date(e.examDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.isPublished ? "bg-success/10 text-success" : "bg-surface-100 text-text-500"}`}>
                      {e.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <Link href={`/exams/${e.id}`} className="text-sm text-spira-700 font-medium shrink-0">View â†’</Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Title</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Course</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Section</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Type</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Max Marks</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Exam Date</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Results</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
                <th scope="col" className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-16" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.length === 0
                  ? <tr><td colSpan={9} className="px-4 py-12 text-center text-text-500">No exams found</td></tr>
                  : data?.data.map((e) => (
                    <tr key={e.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-900">{e.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-spira-800">{e.courseOffering.course.code}</td>
                      <td className="px-4 py-3 text-text-500">{e.courseOffering.section.name}</td>
                      <td className="px-4 py-3 text-text-500 capitalize">{e.examType}</td>
                      <td className="px-4 py-3 text-text-500">{e.maxMarks}</td>
                      <td className="px-4 py-3 text-text-500">{e.examDate ? new Date(e.examDate).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "â€”"}</td>
                      <td className="px-4 py-3 text-text-500">{e._count.results}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${e.isPublished ? "bg-success/10 text-success" : "bg-text-500/10 text-text-500"}`}>
                          {e.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/exams/${e.id}`} className="text-xs text-spira-700 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}

function StudentDashboard({ exams, questionPapers, isLoading }: { exams: Exam[]; questionPapers: Doc[]; isLoading: boolean }) {
  const [selectedSubject, setSelectedSubject] = useState(0);
  const total = SUBJECT_RESULTS.reduce((s, r) => s + r.marks, 0);
  const maxTotal = SUBJECT_RESULTS.reduce((s, r) => s + r.max, 0);
  const percentage = Math.round((total / maxTotal) * 100);

  const upcoming = exams.filter((e) => e.isPublished && e.examDate && new Date(e.examDate) >= new Date());
  const sub = SUBJECT_RESULTS[selectedSubject];

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-900">Exams & Results</h1>
        <p className="text-text-500 text-sm mt-0.5">Term 1 Â· Academic Year 2025â€“26</p>
      </div>

      {/* Overall score card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Overall Performance</p>
            <p className="text-4xl font-black">{total}<span className="text-2xl text-indigo-200">/{maxTotal}</span></p>
            <p className="text-indigo-100 text-sm mt-1">Aggregate across 4 subjects</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-black">{percentage}%</p>
            <p className="text-indigo-200 text-sm mt-1">Grade: A</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 bg-indigo-900/40 rounded-full h-3">
          <div className="bg-white rounded-full h-3 transition-all" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {/* Subject cards grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Subject Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECT_RESULTS.map((r, i) => (
            <button
              key={r.code}
              onClick={() => setSelectedSubject(i)}
              className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${selectedSubject === i ? "border-indigo-500 shadow-md" : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-text-400">{r.code}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS[r.grade] ?? "bg-gray-100 text-gray-600"}`}>{r.grade}</span>
              </div>
              <p className="text-sm font-semibold text-text-900 leading-tight">{r.subject}</p>
              <p className="text-2xl font-black mt-1" style={{ color: r.color }}>{r.marks}<span className="text-sm text-text-400">/{r.max}</span></p>
              {/* Mini bar */}
              <div className="mt-2 bg-surface-100 rounded-full h-1.5">
                <div className="rounded-full h-1.5" style={{ width: `${(r.marks / r.max) * 100}%`, backgroundColor: r.color }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Assessment chart for selected subject */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-900">{sub.subject} â€” Assessment Breakdown</h2>
            <p className="text-xs text-text-400 mt-0.5">Click a subject card above to switch</p>
          </div>
          <span className={`text-sm px-2.5 py-1 rounded-full font-bold ${GRADE_COLORS[sub.grade] ?? ""}`}>{sub.grade}</span>
        </div>
        <BarChart data={sub.tests} color={sub.color} />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {sub.tests.map((t) => (
            <div key={t.name} className="text-center p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-text-400 mb-1">{t.name}</p>
              <p className="text-xl font-black text-text-900">{t.marks}<span className="text-sm text-text-400">/{t.max}</span></p>
              <p className="text-xs font-medium mt-0.5" style={{ color: sub.color }}>{Math.round((t.marks / t.max) * 100)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming exams */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Upcoming Exams</h2>
          <div className="space-y-2">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/exams/${e.id}`} className="flex items-center justify-between bg-white border border-border rounded-xl p-4 hover:border-spira-400 hover:shadow-sm transition-all">
                <div>
                  <p className="font-semibold text-text-900">{e.title}</p>
                  <p className="text-xs text-text-500 mt-0.5">{e.courseOffering.course.name} Â· {e.maxMarks} marks</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {e.examDate && (
                    <>
                      <p className="text-sm font-bold text-spira-700">{new Date(e.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}</p>
                      <p className="text-xs text-text-400 capitalize">{e.examType}</p>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Question Papers */}
      <div>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Previous Year Question Papers</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-surface-100 rounded-xl animate-pulse" />)}
          </div>
        ) : questionPapers.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-6 text-center text-text-500 text-sm">No question papers uploaded yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {questionPapers.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center gap-3 bg-white border border-border rounded-xl p-4 hover:border-indigo-400 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 text-xl">ðŸ“</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-900 truncate group-hover:text-indigo-700">{doc.title}</p>
                  <p className="text-xs text-text-400 mt-0.5 capitalize">{doc.category.replace("_", " ")}</p>
                </div>
                <span className="text-xs text-indigo-600 font-medium shrink-0">View â†’</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BarChart({ data, color }: { data: { name: string; marks: number; max: number }[]; color: string }) {
  const maxH = 100;
  return (
    <div className="flex items-end gap-3 h-28">
      {data.map((d, i) => {
        const pct = d.marks / d.max;
        const h = Math.round(pct * maxH);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-text-900">{d.marks}</span>
            <div className="w-full flex items-end" style={{ height: maxH }}>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${h}%`, backgroundColor: color, opacity: 0.85 }}
              />
            </div>
            <span className="text-xs text-text-400 text-center leading-tight">{d.name}</span>
          </div>
        );
      })}
    </div>
  );
}
