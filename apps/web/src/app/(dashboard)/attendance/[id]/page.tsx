"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface RosterStudent {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

interface AttendanceRecord {
  studentProfile: RosterStudent;
  status: string;
  remark?: string;
}

interface RosterData {
  id: string;
  sessionDate: string;
  periodNumber: number;
  submittedAt?: string;
  section: { name: string };
  teacher?: { user: { displayName: string } };
  records: AttendanceRecord[];
  rosterStudents?: RosterStudent[];
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-success/10 text-success ring-success/20",
  absent: "bg-red-100 text-red-700 ring-red-200",
  late: "bg-amber-100 text-amber-700 ring-amber-200",
  excused: "bg-blue-100 text-blue-700 ring-blue-200",
};

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export default function AttendanceRosterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const rosterKey = mounted && !!getAccessToken() ? `/attendance/sessions/${id}/roster` : null;

  const { data: roster, isLoading } = useSWR<RosterData>(
    rosterKey,
    (url: string) => apiClient.get<RosterData>(url),
  );

  // Local state for marking — pre-fill "present" for unsubmitted sessions
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!roster) return;
    if (roster.submittedAt) {
      // Pre-fill from submitted records
      const init: Record<string, AttendanceStatus> = {};
      for (const r of roster.records) {
        init[r.studentProfile.id] = r.status as AttendanceStatus;
      }
      setMarks(init);
    } else {
      // Default all students to "present"
      const init: Record<string, AttendanceStatus> = {};
      const students = roster.rosterStudents ?? roster.records.map((r) => r.studentProfile);
      for (const s of students) {
        init[s.id] = "present";
      }
      setMarks(init);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster?.id]); // intentional: re-initialise only when the session changes, not on every SWR refresh

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
      await apiClient.post(`/attendance/sessions/${id}/submit`, { records });
      await mutate(rosterKey);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    const students = roster?.rosterStudents ?? roster?.records.map((r) => r.studentProfile) ?? [];
    const update: Record<string, AttendanceStatus> = {};
    for (const s of students) update[s.id] = status;
    setMarks(update);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-6 bg-surface-100 rounded animate-pulse w-48" />
        <div className="h-64 bg-surface-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!roster) return null;

  const students = roster.submittedAt
    ? roster.records.map((r) => r.studentProfile)
    : (roster.rosterStudents ?? []);

  const isSubmitted = !!roster.submittedAt;
  const summary = STATUSES.map((s) => ({
    status: s,
    count: Object.values(marks).filter((v) => v === s).length,
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link href="/attendance" className="text-sm text-spira-700 hover:underline">&larr; Back to attendance</Link>
        <div className="flex items-start justify-between mt-2 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-text-900">
              {roster.section.name} — Period {roster.periodNumber}
            </h1>
            <p className="text-sm text-text-500 mt-0.5">
              {new Date(roster.sessionDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
              {roster.teacher && ` · ${roster.teacher.user.displayName}`}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isSubmitted ? "bg-success/10 text-success" : "bg-amber-100 text-amber-700"}`}>
            {isSubmitted ? "Submitted" : "Open — not submitted"}
          </span>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {summary.map(({ status, count }) => (
          <div key={status} className={`px-3 py-1.5 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${STATUS_COLORS[status]}`}>
            {status}: {count}
          </div>
        ))}
        <span className="text-xs text-text-500">/ {students.length} students</span>
      </div>

      {/* Quick-mark bar (only for unsubmitted) */}
      {!isSubmitted && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-500 mr-1">Mark all:</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => markAll(s)}
              className={`px-3 py-1 text-xs rounded-full font-medium ring-1 ring-inset capitalize hover:opacity-80 transition-opacity ${STATUS_COLORS[s]}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {submitError && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">{submitError}</div>
      )}

      {/* Roster table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm" aria-label="Attendance roster">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              <th className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Student</th>
              <th className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Adm. No.</th>
              <th className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-text-500">No students in this section</td></tr>
            ) : students.map((s, idx) => (
              <tr key={s.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                <td className="px-4 py-3 text-text-500 text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-text-900">{s.firstName} {s.lastName}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-500">{s.admissionNo}</td>
                <td className="px-4 py-3">
                  {isSubmitted ? (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${STATUS_COLORS[(marks[s.id] ?? "absent") as AttendanceStatus]}`}>
                      {marks[s.id] ?? "—"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label={`Status for ${s.firstName} ${s.lastName}`}>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: status }))}
                          aria-pressed={marks[s.id] === status}
                          className={`px-2.5 py-1 text-xs rounded-full font-medium ring-1 ring-inset capitalize transition-all ${
                            marks[s.id] === status
                              ? STATUS_COLORS[status] + " shadow-sm scale-105"
                              : "bg-surface-50 text-text-500 ring-border hover:bg-surface-100"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit button */}
      {!isSubmitted && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            className="px-6 py-2.5 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors disabled:opacity-60"
          >
            {submitting ? "Submitting…" : `Submit attendance (${students.length} students)`}
          </button>
          <p className="text-xs text-text-500">This action cannot be undone.</p>
        </div>
      )}

      {isSubmitted && (
        <p className="text-xs text-text-500">
          Submitted {new Date(roster.submittedAt!).toLocaleString("en-IN", { timeZone: "UTC" })}
        </p>
      )}
    </div>
  );
}
