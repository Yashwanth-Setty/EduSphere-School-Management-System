"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface OnlineClass {
  id: string;
  title: string;
  scheduledAt: string;
  durationMins: number;
  meetingLink: string;
  status: string;
  courseOffering: {
    course: { code: string; name: string };
    section: { name: string };
  };
  host: { firstName: string; lastName: string };
}

const STATUS_STYLE: Record<string, string> = {
  upcoming:  "border-yellow-200 bg-yellow-50",
  live:      "border-green-200 bg-green-50",
  completed: "border-gray-200 bg-gray-50",
};

export default function OnlineClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: oc, isLoading } = useSWR<OnlineClass>(
    mounted && !!getAccessToken() ? `/online-classes/${id}` : null,
    (url: string) => apiClient.get<OnlineClass>(url),
  );

  if (isLoading) {
    return <div className="p-4 md:p-6 text-text-500 text-sm animate-pulse">Loading class details…</div>;
  }
  if (!oc) {
    return <div className="p-4 md:p-6 text-text-500 text-sm">Class not found.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-2xl">
      <Link href="/online-classes" className="text-sm text-spira-700 hover:underline">← Online Classes</Link>

      <div className={`rounded-xl border p-6 ${STATUS_STYLE[oc.status] ?? "border-border bg-white"}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-text-900">{oc.title}</h1>
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white border border-current capitalize text-text-700">
            {oc.status}
          </span>
        </div>
        <p className="text-text-500 text-sm mt-1">{oc.courseOffering.course.name} · {oc.courseOffering.section.name}</p>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-text-400 uppercase tracking-wide mb-1">Date & Time</p>
            <p className="text-text-900 font-medium">
              {new Date(oc.scheduledAt).toLocaleString("en-IN", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-400 uppercase tracking-wide mb-1">Duration</p>
            <p className="text-text-900 font-medium">{oc.durationMins} minutes</p>
          </div>
          <div>
            <p className="text-xs text-text-400 uppercase tracking-wide mb-1">Host</p>
            <p className="text-text-900 font-medium">{oc.host.firstName} {oc.host.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-text-400 uppercase tracking-wide mb-1">Course</p>
            <p className="text-text-900 font-medium">{oc.courseOffering.course.code}</p>
          </div>
        </div>

        {oc.status !== "completed" && (
          <a
            href={oc.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 w-full justify-center py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            🎥 Join Online Class
          </a>
        )}
        {oc.status === "completed" && (
          <p className="text-center text-sm text-text-500 py-2">This session has ended.</p>
        )}
      </div>
    </div>
  );
}
