"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomLabel?: string;
  courseOfferingId?: string;
}

interface Section {
  id: string;
  name: string;
}

export default function TimetablePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [term, setTerm] = useState("term_1");
  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();

  const { data: sections } = useSWR<Section[]>(
    hasToken ? "/timetable/sections" : null,
    (url: string) => apiClient.get<Section[]>(url),
  );

  const { data: slots, isLoading } = useSWR<TimetableSlot[]>(
    hasToken && selectedSection
      ? `/timetable/section/${selectedSection}?term=${term}`
      : null,
    (url: string) => apiClient.get<TimetableSlot[]>(url),
  );

  // Build a lookup map: day -> period -> slot
  const grid: Record<number, Record<number, TimetableSlot>> = {};
  for (const slot of slots ?? []) {
    if (!grid[slot.dayOfWeek]) grid[slot.dayOfWeek] = {};
    grid[slot.dayOfWeek][slot.periodNumber] = slot;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Timetable</h1>
          <p className="text-text-500 text-sm mt-0.5">Weekly schedule by section</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Select term"
            className="flex-1 md:flex-none px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white"
          >
            <option value="term_1">Term 1</option>
            <option value="term_2">Term 2</option>
            <option value="term_3">Term 3</option>
          </select>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            aria-label="Select section"
            className="flex-1 md:flex-none px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white md:min-w-[140px]"
          >
            <option value="">— Select section —</option>
            {(sections ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedSection ? (
        <div className="bg-white rounded-lg border border-border p-12 text-center text-text-500 text-sm">
          Select a section above to view its timetable
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-text-500 text-sm animate-pulse">Loading timetable…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" aria-label="Timetable grid">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide w-20">Period</th>
                    {DAYS.map((d) => (
                      <th key={d} className="text-center px-3 py-3 font-medium text-text-700 text-xs uppercase tracking-wide">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => {
                    const anySlot = Object.values(grid).find((d) => d[period]);
                    const timeLabel = anySlot ? `${anySlot[period].startTime}–${anySlot[period].endTime}` : "";
                    return (
                      <tr key={period} className="border-b border-surface-100 last:border-0">
                        <td className="px-4 py-3 text-xs text-text-500">
                          <span className="font-medium text-text-700">P{period}</span>
                          {timeLabel && <span className="block text-text-500 text-xs mt-0.5">{timeLabel}</span>}
                        </td>
                        {DAYS.map((_, dayIdx) => {
                          const slot = grid[dayIdx]?.[period];
                          return (
                            <td key={dayIdx} className="px-3 py-3 text-center align-middle">
                              {slot ? (
                                <div className="inline-flex flex-col items-center gap-0.5 bg-spira-500/10 text-spira-800 rounded-md px-2 py-1.5 text-xs w-full max-w-[120px]">
                                  <span className="font-medium text-[10px] text-spira-600 truncate w-full text-center">{slot.roomLabel ?? "Scheduled"}</span>
                                  <span className="text-[9px] text-spira-500">{slot.startTime}–{slot.endTime}</span>
                                </div>
                              ) : (
                                <span className="text-text-500 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
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
