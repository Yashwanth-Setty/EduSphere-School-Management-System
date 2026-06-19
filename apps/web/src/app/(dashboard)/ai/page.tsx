"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface RunResult {
  processed: number;
  created: number;
}

type JobKey = "attendance-risk" | "performance-summary";

const JOBS: { key: JobKey; label: string; desc: string; icon: string }[] = [
  {
    key: "attendance-risk",
    label: "Attendance Risk Scoring",
    desc: "Analyses the last 30 days of attendance for every active student and flags high- and medium-risk cases.",
    icon: "📋",
  },
  {
    key: "performance-summary",
    label: "Performance Summary",
    desc: "Computes average exam scores from all published results and generates a narrative summary per student.",
    icon: "📊",
  },
];

export default function AiInsightsPage() {
  const [running, setRunning] = useState<JobKey | null>(null);
  const [results, setResults] = useState<Record<JobKey, RunResult | null>>({
    "attendance-risk": null,
    "performance-summary": null,
  });
  const [error, setError] = useState<string | null>(null);

  async function runJob(key: JobKey) {
    setRunning(key);
    setError(null);
    try {
      const res = await apiClient.post<RunResult>(`/ai/run/${key}`, {});
      setResults((prev) => ({ ...prev, [key]: res }));
    } catch {
      setError(`Failed to run ${key}. Check API connectivity.`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-900">AI Insights</h1>
        <p className="text-text-500 text-sm mt-1">
          Rule-based scoring and recommendation generation — no external model calls required.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Job cards */}
      <section>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Run Analysis</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {JOBS.map((job) => {
            const result = results[job.key];
            const isRunning = running === job.key;
            return (
              <div key={job.key} className="bg-white rounded-lg border border-border shadow-sm p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{job.icon}</span>
                  <div>
                    <p className="font-semibold text-text-900">{job.label}</p>
                    <p className="text-sm text-text-500 mt-1">{job.desc}</p>
                  </div>
                </div>

                {result && (
                  <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-800">
                    Processed <strong>{result.processed}</strong> students — <strong>{result.created}</strong> recommendations written.
                  </div>
                )}

                <button
                  onClick={() => runJob(job.key)}
                  disabled={isRunning || running !== null}
                  className="w-full py-2 px-4 bg-spira-700 text-white text-sm font-medium rounded-md hover:bg-spira-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning ? "Running…" : "Run Now"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Navigation */}
      <section>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Browse</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/ai/recommendations"
            className="bg-white rounded-lg border border-border shadow-sm p-5 hover:border-spira-400 hover:shadow-md transition-all group flex items-start gap-3"
          >
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-text-900 group-hover:text-spira-800 transition-colors">All Recommendations</p>
              <p className="text-sm text-text-500 mt-1">Browse and filter all AI-generated insights across the school.</p>
            </div>
          </Link>
          <Link
            href="/ai/audit"
            className="bg-white rounded-lg border border-border shadow-sm p-5 hover:border-spira-400 hover:shadow-md transition-all group flex items-start gap-3"
          >
            <span className="text-2xl">🗂️</span>
            <div>
              <p className="font-semibold text-text-900 group-hover:text-spira-800 transition-colors">AI Audit Log</p>
              <p className="text-sm text-text-500 mt-1">View a history of all AI analysis runs and their outcomes.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
