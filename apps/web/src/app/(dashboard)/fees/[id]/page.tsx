"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Payment {
  id: string;
  amount: number;
  method: string;
  referenceNo: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  issuedAt: string;
  feePlan: { name: string; currency: string; description: string | null };
  studentProfile?: {
    admissionNo: string;
    firstName: string;
    lastName: string;
    user: { email: string };
    section: { name: string } | null;
  };
  payments: Payment[];
}

const STATUS_STYLE: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  pending: "bg-red-100 text-red-700",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const key = mounted && !!getAccessToken() ? `/fees/invoices/${id}` : null;
  const { data: inv, isLoading } = useSWR<Invoice>(key, (url: string) => apiClient.get<Invoice>(url));

  // Payment form state
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setPayError("");
    if (!payAmount || Number(payAmount) <= 0) { setPayError("Enter a valid amount."); return; }
    setPaying(true);
    try {
      await apiClient.post(`/fees/invoices/${id}/payments`, {
        amount: Number(payAmount),
        method: payMethod,
        referenceNo: payRef || undefined,
      });
      setShowPayment(false);
      setPayAmount("");
      setPayRef("");
      mutate(key);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 bg-surface-100 rounded animate-pulse w-64" />
        ))}
      </div>
    );
  }

  if (!inv) return <div className="p-6 text-text-500">Invoice not found.</div>;

  const balance = inv.amountDue - inv.amountPaid;
  const isOverdue = inv.status !== "paid" && new Date(inv.dueDate) < new Date();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-xs text-text-400 hover:text-text-700 mb-2">← Back</button>
          <h1 className="text-2xl font-semibold text-text-900">{inv.invoiceNo}</h1>
          <p className="text-text-500 text-sm mt-0.5">{inv.feePlan.name}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_STYLE[inv.status] ?? ""}`}>
          {inv.status}
          {isOverdue && inv.status !== "paid" ? " · Overdue" : ""}
        </span>
      </div>

      {/* Invoice summary */}
      <div className="bg-white rounded-lg border border-border shadow-sm divide-y divide-surface-100">
        <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-400 text-xs uppercase tracking-wide mb-1">Amount Due</p>
            <p className="font-semibold text-text-900 text-lg">{inv.feePlan.currency} {inv.amountDue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-text-400 text-xs uppercase tracking-wide mb-1">Amount Paid</p>
            <p className="font-semibold text-green-700 text-lg">{inv.feePlan.currency} {inv.amountPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-text-400 text-xs uppercase tracking-wide mb-1">Balance</p>
            <p className={`font-semibold text-lg ${balance > 0 ? "text-red-600" : "text-green-700"}`}>
              {inv.feePlan.currency} {balance.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-text-400 text-xs uppercase tracking-wide mb-1">Due Date</p>
            <p className={`font-medium ${isOverdue ? "text-red-600" : "text-text-900"}`}>
              {new Date(inv.dueDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}
            </p>
          </div>
        </div>

        {inv.studentProfile && (
          <div className="px-6 py-4 text-sm">
            <p className="text-text-400 text-xs uppercase tracking-wide mb-2">Student</p>
            <p className="font-medium text-text-900">{inv.studentProfile.firstName} {inv.studentProfile.lastName}</p>
            <p className="text-text-500">{inv.studentProfile.admissionNo} · {inv.studentProfile.user.email}</p>
            {inv.studentProfile.section && <p className="text-text-400 text-xs mt-0.5">Section: {inv.studentProfile.section.name}</p>}
          </div>
        )}

        <div className="px-6 py-4 text-xs text-text-400">
          Issued: {new Date(inv.issuedAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}
          {inv.feePlan.description && <span className="ml-4">{inv.feePlan.description}</span>}
        </div>
      </div>

      {/* Payments history */}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="font-medium text-text-900">Payments ({inv.payments.length})</h2>
          {inv.status !== "paid" && (
            <button
              onClick={() => setShowPayment((v) => !v)}
              className="px-4 py-1.5 text-xs font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors"
            >
              Record Payment
            </button>
          )}
        </div>

        {showPayment && (
          <form onSubmit={submitPayment} className="px-6 py-4 border-b border-surface-100 bg-surface-50 space-y-3">
            {payError && <p className="text-xs text-red-600">{payError}</p>}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-32">
                <label className="text-xs text-text-600 mb-1 block">Amount</label>
                <input
                  type="number" min={0.01} step="0.01"
                  value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Max ${balance}`}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
                />
              </div>
              <div>
                <label className="text-xs text-text-600 mb-1 block">Method</label>
                <select
                  value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                  className="border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
                >
                  {["cash", "bank_transfer", "card", "cheque", "online"].map((m) => (
                    <option key={m} value={m}>{m.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-32">
                <label className="text-xs text-text-600 mb-1 block">Reference No.</label>
                <input
                  type="text"
                  value={payRef} onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={paying} className="px-4 py-1.5 text-xs font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors">
                {paying ? "Saving…" : "Save Payment"}
              </button>
              <button type="button" onClick={() => setShowPayment(false)} className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-white transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {inv.payments.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-text-400">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Method</th>
                <th className="text-left px-6 py-2 text-xs font-medium text-text-500 uppercase tracking-wide">Reference</th>
              </tr>
            </thead>
            <tbody>
              {inv.payments.map((p) => (
                <tr key={p.id} className="border-b border-surface-100 last:border-0">
                  <td className="px-6 py-3 text-text-600">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "—"}
                  </td>
                  <td className="px-6 py-3 font-medium text-text-900">{inv.feePlan.currency} {p.amount.toLocaleString()}</td>
                  <td className="px-6 py-3 text-text-600 capitalize">{p.method.replace("_", " ")}</td>
                  <td className="px-6 py-3 text-text-400 font-mono text-xs">{p.referenceNo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Receipt link */}
      <div className="text-xs text-text-400">
        <a
          href={`/fees/${inv.id}/receipt`}
          className="text-spira-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          View printable receipt →
        </a>
      </div>
    </div>
  );
}
