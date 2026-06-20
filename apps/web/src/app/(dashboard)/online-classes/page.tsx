"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";

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
  upcoming:  "bg-yellow-100 text-yellow-700",
  live:      "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
};

export default function OnlineClassesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as Role[];
  const canCreate = roles.some((r) => r === Role.ADMIN || r === Role.PRINCIPAL || r === Role.TEACHER);

  const { data, isLoading } = useSWR<{ data: OnlineClass[]; total: number }>(
    mounted && !!getAccessToken() ? "/online-classes?page=1&pageSize=20" : null,
    (url: string) => apiClient.get<{ data: OnlineClass[]; total: number }>(url),
  );

  const classes = data?.data ?? [];
  const upcoming = classes.filter((c) => c.status === "upcoming" || c.status === "live");
  const completed = classes.filter((c) => c.status === "completed");

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Online Classes</h1>
          <p className="text-text-500 text-sm mt-0.5">Virtual sessions and meeting links</p>
        </div>
        {canCreate && (
          <Link href="/online-classes/new" className="inline-flex items-center gap-2 px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-md hover:bg-spira-800 transition-colors">
            + Schedule Class
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface-100 rounded-xl animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-4xl mb-3">🎥</p>
          <p className="font-medium text-text-900">No online classes yet</p>
          <p className="text-text-500 text-sm mt-1">Scheduled sessions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Upcoming & Live</h2>
              <div className="space-y-3">
                {upcoming.map((oc) => (
                  <ClassCard key={oc.id} oc={oc} />
                ))}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">Completed</h2>
              <div className="space-y-3">
                {completed.map((oc) => (
                  <ClassCard key={oc.id} oc={oc} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ClassCard({ oc }: { oc: OnlineClass }) {
  const STATUS_STYLE: Record<string, string> = {
    upcoming:  "bg-yellow-100 text-yellow-700",
    live:      "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
  };

  return (
    <Link href={`/online-classes/${oc.id}`} className="flex items-start justify-between gap-3 bg-white rounded-xl border border-border p-4 hover:border-spira-400 hover:shadow-md transition-all group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-text-900 group-hover:text-spira-700 transition-colors">{oc.title}</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[oc.status] ?? "bg-gray-100 text-gray-600"}`}>
            {oc.status.charAt(0).toUpperCase() + oc.status.slice(1)}
          </span>
        </div>
        <p className="text-sm text-text-500 mt-0.5">{oc.courseOffering.course.name} · {oc.courseOffering.section.name}</p>
        <p className="text-xs text-text-400 mt-1">
          {new Date(oc.scheduledAt).toLocaleString("en-IN", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })}
          {" "}· {oc.durationMins} min · {oc.host.firstName} {oc.host.lastName}
        </p>
      </div>
      {oc.status !== "completed" && (
        <a
          href={oc.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          Join
        </a>
      )}
    </Link>
  );
}
