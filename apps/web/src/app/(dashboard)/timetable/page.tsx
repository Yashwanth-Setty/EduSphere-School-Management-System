"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5, 6];

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomLabel?: string;
  courseOfferingId?: string;
  courseOffering?: { course: { name: string; code: string } };
}

interface Section { id: string; name: string }

// School calendar events for dashboard
const HOLIDAYS = [
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-11-14", name: "Children's Day" },
  { date: "2026-12-25", name: "Christmas" },
  { date: "2027-01-26", name: "Republic Day" },
];

const EVENTS = [
  { date: "2026-08-20", name: "Math Mid-term Exam",    type: "exam" },
  { date: "2026-08-22", name: "Science Mid-term Exam", type: "exam" },
  { date: "2026-09-05", name: "Teachers' Day",          type: "event" },
  { date: "2026-09-15", name: "Science Exhibition",     type: "event" },
  { date: "2026-09-20", name: "Math Assignment Due",    type: "assignment" },
  { date: "2026-10-10", name: "Annual Sports Day",      type: "event" },
  { date: "2026-11-01", name: "Term 1 Final Exams",     type: "exam" },
  { date: "2026-11-15", name: "English Assignment Due",  type: "assignment" },
];

const TYPE_STYLE: Record<string, string> = {
  exam:       "bg-red-100 text-red-700",
  event:      "bg-blue-100 text-blue-700",
  assignment: "bg-amber-100 text-amber-700",
  holiday:    "bg-green-100 text-green-700",
};
const TYPE_ICON: Record<string, string> = {
  exam: "📝", event: "🎉", assignment: "📋", holiday: "🏖",
};

const SUBJECT_COLORS: Record<string, string> = {
  "Mathematics":    "#6366f1",
  "Science":        "#22c55e",
  "English":        "#f59e0b",
  "Social Studies": "#ec4899",
};
function subjectColor(name: string) {
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if (name.includes(k)) return v;
  }
  return "#94a3b8";
}

export default function TimetablePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [term, setTerm] = useState("term_1");
  const [view, setView] = useState<"week" | "calendar">("week");
  useEffect(() => { setMounted(true); }, []);

  const { user } = useAuth();
  const roles = (user?.roles ?? []) as Role[];
  const isStudentOrParent = roles.some((r) => r === Role.STUDENT || r === Role.PARENT);

  const hasToken = mounted && !!getAccessToken();

  const { data: sections } = useSWR<Section[]>(
    hasToken && !isStudentOrParent ? "/timetable/sections" : null,
    (url: string) => apiClient.get<Section[]>(url),
  );

  // Students get their own timetable automatically; API returns { data: TimetableSlot[] }
  const { data: myRaw, isLoading: myLoading } = useSWR<{ data: TimetableSlot[] } | TimetableSlot[]>(
    hasToken && isStudentOrParent ? "/timetable/slots" : null,
    (url: string) => apiClient.get<{ data: TimetableSlot[] } | TimetableSlot[]>(url),
  );
  const mySlots: TimetableSlot[] = Array.isArray(myRaw) ? myRaw : (myRaw as { data: TimetableSlot[] })?.data ?? [];

  const { data: adminSlots, isLoading: adminLoading } = useSWR<TimetableSlot[]>(
    hasToken && !isStudentOrParent && selectedSection
      ? `/timetable/section/${selectedSection}?term=${term}`
      : null,
    (url: string) => apiClient.get<TimetableSlot[]>(url),
  );

  const slots = isStudentOrParent ? mySlots : (adminSlots ?? []);
  const isLoading = isStudentOrParent ? myLoading : adminLoading;

  const grid: Record<number, Record<number, TimetableSlot>> = {};
  for (const slot of slots) {
    if (!grid[slot.dayOfWeek]) grid[slot.dayOfWeek] = {};
    grid[slot.dayOfWeek][slot.periodNumber] = slot;
  }

  // Today's schedule
  const today = new Date().getDay(); // 0=Sun,1=Mon..
  const todayIdx = today - 1; // 0=Mon
  const todaySlots = DAYS.flatMap((_, i) => i === todayIdx ? (grid[i] ? Object.values(grid[i]) : []) : []);

  const upcoming = [...EVENTS.filter(e => new Date(e.date) >= new Date())]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const upcomingHolidays = HOLIDAYS.filter(h => new Date(h.date) >= new Date()).slice(0, 3);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Timetable</h1>
          <p className="text-text-500 text-sm mt-0.5">Academic Year 2025–26</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(["week", "calendar"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${view === v ? "bg-spira-700 text-white" : "bg-white text-text-600 hover:bg-surface-50"}`}>
                {v === "week" ? "📅 Week" : "📆 Year"}
              </button>
            ))}
          </div>
          {!isStudentOrParent && (
            <>
              <select value={term} onChange={(e) => setTerm(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-white">
                <option value="term_1">Term 1</option>
                <option value="term_2">Term 2</option>
                <option value="term_3">Term 3</option>
              </select>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-white md:min-w-[140px]">
                <option value="">— Section —</option>
                {(sections ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {view === "calendar" ? (
        <YearCalendar events={EVENTS} holidays={HOLIDAYS} />
      ) : (
        <>
          {/* Metrics row */}
          {isStudentOrParent && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "School Days",    value: "180", icon: "🏫", color: "from-blue-500 to-blue-700" },
                { label: "Holidays",       value: `${HOLIDAYS.length}`, icon: "🏖", color: "from-green-500 to-green-700" },
                { label: "Upcoming Exams", value: `${EVENTS.filter(e => e.type === "exam" && new Date(e.date) >= new Date()).length}`, icon: "📝", color: "from-red-500 to-red-700" },
                { label: "Events Left",    value: `${EVENTS.filter(e => e.type === "event" && new Date(e.date) >= new Date()).length}`, icon: "🎉", color: "from-purple-500 to-purple-700" },
              ].map((m) => (
                <div key={m.label} className={`bg-gradient-to-br ${m.color} rounded-xl p-4 text-white`}>
                  <p className="text-2xl mb-1">{m.icon}</p>
                  <p className="text-3xl font-black">{m.value}</p>
                  <p className="text-xs opacity-80 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Today + upcoming */}
          {isStudentOrParent && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Today's timetable */}
              <div className="bg-white rounded-2xl border border-border p-5">
                <h2 className="text-sm font-semibold text-text-900 mb-3">Today — {DAYS[todayIdx] ?? "Weekend"}</h2>
                {todayIdx < 0 || todayIdx > 4 ? (
                  <p className="text-text-400 text-sm">No classes today. Enjoy your weekend! 🎉</p>
                ) : todaySlots.length === 0 ? (
                  <p className="text-text-400 text-sm">No timetable data loaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {todaySlots.sort((a, b) => a.periodNumber - b.periodNumber).map((s) => {
                      const name = s.courseOffering?.course.name ?? s.roomLabel ?? "Class";
                      const code = s.courseOffering?.course.code;
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors">
                          <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: subjectColor(name) }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-900 truncate">{name}</p>
                            {code && <p className="text-xs text-text-400">{code}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-text-700">{s.startTime}–{s.endTime}</p>
                            <p className="text-xs text-text-400">Period {s.periodNumber}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upcoming events */}
              <div className="bg-white rounded-2xl border border-border p-5">
                <h2 className="text-sm font-semibold text-text-900 mb-3">Upcoming Events</h2>
                <div className="space-y-2">
                  {[...upcoming, ...upcomingHolidays.map(h => ({ ...h, type: "holiday" }))].slice(0, 6).map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-surface-100">
                      <span className="text-xl">{TYPE_ICON[e.type] ?? "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-900 truncate">{e.name}</p>
                        <span className={`inline-flex text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${TYPE_STYLE[e.type] ?? ""}`}>{e.type}</span>
                      </div>
                      <p className="text-xs font-medium text-text-500 shrink-0">
                        {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Weekly timetable grid */}
          {(!isStudentOrParent && !selectedSection) ? (
            <div className="bg-white rounded-lg border border-border p-12 text-center text-text-500 text-sm">
              Select a section above to view its timetable
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-border bg-surface-50">
                <h2 className="text-sm font-semibold text-text-900">Weekly Schedule</h2>
              </div>
              {isLoading ? (
                <div className="p-8 text-center text-text-500 text-sm animate-pulse">Loading timetable…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse" aria-label="Timetable grid">
                    <thead>
                      <tr className="bg-surface-50 border-b border-surface-100">
                        <th className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide w-16">Period</th>
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
                              const name = slot?.courseOffering?.course.name ?? slot?.roomLabel;
                              const color = name ? subjectColor(name) : "#94a3b8";
                              return (
                                <td key={dayIdx} className="px-2 py-2 text-center align-middle">
                                  {slot ? (
                                    <div className="inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs w-full max-w-[130px] border"
                                      style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
                                      <span className="font-semibold text-[11px] truncate w-full text-center" style={{ color }}>{name ?? "Class"}</span>
                                      <span className="text-[10px]" style={{ color: `${color}99` }}>{slot.startTime}–{slot.endTime}</span>
                                    </div>
                                  ) : (
                                    <span className="text-text-300 text-xs">—</span>
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
        </>
      )}
    </div>
  );
}

function YearCalendar({ events, holidays }: { events: typeof EVENTS; holidays: typeof HOLIDAYS }) {
  const year = 2026;
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return { month: i, name: d.toLocaleString("en-IN", { month: "long" }) };
  });

  const allMarkers = [
    ...events.map(e => ({ ...e, type: e.type as string })),
    ...holidays.map(h => ({ ...h, type: "holiday" as string })),
  ];

  function getDayEvents(y: number, m: number, d: number) {
    const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return allMarkers.filter(e => e.date === ds);
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(TYPE_STYLE).map(([type, cls]) => (
          <span key={type} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>
            {TYPE_ICON[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map(({ month, name }) => {
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const blanks = (firstDay + 6) % 7; // Mon-start
          return (
            <div key={month} className="bg-white rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-text-900 mb-3">{name} {year}</p>
              <div className="grid grid-cols-7 gap-px">
                {["M","T","W","T","F","S","S"].map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-text-400 font-medium pb-1">{d}</div>
                ))}
                {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayEvents = getDayEvents(year, month, day);
                  const isWeekend = ((blanks + day - 1) % 7) >= 5;
                  const dotColor = dayEvents[0]?.type ? TYPE_STYLE[dayEvents[0].type]?.split(" ")[0]?.replace("bg-", "") : null;
                  return (
                    <div key={day} className="relative group">
                      <div className={`text-center text-[11px] rounded-md py-0.5 ${isWeekend ? "text-text-300" : "text-text-700"} ${dayEvents.length > 0 ? "font-bold" : ""}`}
                        style={dayEvents.length > 0 ? { backgroundColor: "#f0f4ff" } : undefined}>
                        {day}
                        {dayEvents.length > 0 && (
                          <div className="flex justify-center gap-px mt-0.5">
                            {dayEvents.slice(0, 2).map((e, i) => (
                              <div key={i} className={`w-1 h-1 rounded-full ${TYPE_STYLE[e.type]?.split(" ")[0] ?? "bg-gray-400"}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 bg-text-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          {dayEvents.map(e => e.name).join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
