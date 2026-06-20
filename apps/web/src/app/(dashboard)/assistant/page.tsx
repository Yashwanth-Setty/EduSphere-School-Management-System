"use client";

import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseOffering: { course: { code: string; name: string } };
  submissions?: Array<{ status: string }>;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  feePlan: { name: string; currency: string };
}

interface Exam {
  id: string;
  title: string;
  examDate: string | null;
  isPublished: boolean;
}

interface AttendanceRecord {
  status: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "What assignments are pending?",
  "How is my attendance?",
  "Do I have any pending fees?",
  "What exams are coming up?",
  "Give me a summary of everything",
];

export default function AssistantPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your SPIRA study assistant. Ask me about your assignments, attendance, fees, or upcoming exams. 👋" },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ready = mounted && !!getAccessToken();

  const { data: assignments } = useSWR<{ data: Assignment[] }>(
    ready ? "/assignments?page=1&pageSize=20" : null,
    (url: string) => apiClient.get<{ data: Assignment[] }>(url),
  );
  const { data: invoices } = useSWR<{ data: Invoice[] }>(
    ready ? "/fees/my-invoices?page=1&pageSize=20" : null,
    (url: string) => apiClient.get<{ data: Invoice[] }>(url),
  );
  const { data: exams } = useSWR<{ data: Exam[] }>(
    ready ? "/exams?page=1&pageSize=10" : null,
    (url: string) => apiClient.get<{ data: Exam[] }>(url),
  );
  const { data: attendance } = useSWR<{ data: AttendanceRecord[] }>(
    ready ? "/attendance/my-records?page=1&pageSize=30" : null,
    (url: string) => apiClient.get<{ data: AttendanceRecord[] }>(url),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function buildContext() {
    const allAssignments = assignments?.data ?? [];
    const pendingAssignments = allAssignments.filter((a) => {
      const sub = (a.submissions ?? [])[0];
      return !sub || sub.status === "pending";
    });

    const allInvoices = invoices?.data ?? [];
    const pendingInvoices = allInvoices.filter((i) => i.status !== "paid");
    const pendingFeeTotal = pendingInvoices.reduce((s, i) => s + (i.amountDue - i.amountPaid), 0);

    const allExams = exams?.data ?? [];
    const upcomingExams = allExams.filter((e) => !e.isPublished && e.examDate && new Date(e.examDate) > new Date());

    const allAttendance = attendance?.data ?? [];
    const presentCount = allAttendance.filter((r) => r.status === "present").length;
    const attendancePct = allAttendance.length > 0 ? Math.round((presentCount / allAttendance.length) * 100) : null;

    return { pendingAssignments, pendingInvoices, pendingFeeTotal, upcomingExams, attendancePct, allAttendance };
  }

  function respond(query: string): string {
    const q = query.toLowerCase();
    const ctx = buildContext();

    if (q.includes("assignment") || q.includes("homework") || q.includes("pending") && q.includes("assign")) {
      if (ctx.pendingAssignments.length === 0)
        return "Great news! You have no pending assignments right now. Keep it up! 🎉";
      const list = ctx.pendingAssignments
        .map((a) => `• ${a.title} (${a.courseOffering.course.code}) — due ${new Date(a.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}`)
        .join("\n");
      return `You have ${ctx.pendingAssignments.length} pending assignment(s):\n${list}`;
    }

    if (q.includes("attendance") || q.includes("absent") || q.includes("present")) {
      if (ctx.attendancePct === null)
        return "No attendance data available yet.";
      const status = ctx.attendancePct >= 90 ? "Excellent" : ctx.attendancePct >= 75 ? "Good" : "Low — please attend more classes";
      return `Your attendance over the last 30 days is ${ctx.attendancePct}%. Status: ${status}.`;
    }

    if (q.includes("fee") || q.includes("invoice") || q.includes("payment") || q.includes("due")) {
      if (ctx.pendingInvoices.length === 0)
        return "All your fees are paid! No outstanding dues. 🎉";
      const list = ctx.pendingInvoices
        .map((i) => `• ${i.feePlan.name}: ${i.feePlan.currency} ${(i.amountDue - i.amountPaid).toLocaleString()} pending`)
        .join("\n");
      return `You have ${ctx.pendingInvoices.length} unpaid invoice(s) totalling ₹${ctx.pendingFeeTotal.toLocaleString()}:\n${list}`;
    }

    if (q.includes("exam") || q.includes("test") || q.includes("upcoming")) {
      if (ctx.upcomingExams.length === 0)
        return "No upcoming exams scheduled right now.";
      const list = ctx.upcomingExams
        .map((e) => `• ${e.title}${e.examDate ? " on " + new Date(e.examDate).toLocaleDateString("en-IN", { timeZone: "UTC" }) : ""}`)
        .join("\n");
      return `Upcoming exam(s):\n${list}`;
    }

    if (q.includes("summary") || q.includes("everything") || q.includes("all") || q.includes("status")) {
      const parts: string[] = [];
      parts.push(`📋 Assignments: ${ctx.pendingAssignments.length} pending`);
      parts.push(`✅ Attendance: ${ctx.attendancePct !== null ? ctx.attendancePct + "%" : "—"}`);
      parts.push(`💰 Fees: ${ctx.pendingInvoices.length > 0 ? ctx.pendingInvoices.length + " unpaid invoice(s)" : "All clear"}`);
      parts.push(`📝 Exams: ${ctx.upcomingExams.length} upcoming`);
      return "Here's your quick summary:\n\n" + parts.join("\n");
    }

    return "I can help you with assignments, attendance, fees, and exams. Try asking:\n• 'What assignments are pending?'\n• 'How is my attendance?'\n• 'Do I have pending fees?'";
  }

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    const reply = respond(text);
    setMessages((prev) => [...prev, userMsg, { role: "assistant", text: reply }]);
    setInput("");
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-900">AI Study Assistant</h1>
        <p className="text-text-500 text-sm mt-0.5">Ask about your assignments, attendance, fees and exams</p>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-xl border border-border overflow-hidden flex flex-col" style={{ height: "420px" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-spira-700 text-white rounded-br-sm"
                  : "bg-surface-100 text-text-800 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask me anything…"
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-spira-700 bg-white"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Quick suggestions */}
      <div>
        <p className="text-xs text-text-400 uppercase tracking-wide mb-2">Quick questions</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="px-3 py-1.5 text-xs text-spira-700 border border-spira-300 rounded-full hover:bg-spira-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
