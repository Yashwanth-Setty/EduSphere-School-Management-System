"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Payment { id: string; amount: number; method: string; referenceNo: string | null; paidAt: string | null }
interface Invoice {
  id: string; invoiceNo: string; amountDue: number; amountPaid: number; status: string;
  dueDate: string; issuedAt: string;
  feePlan: { name: string; currency: string; description: string | null };
  studentProfile?: { admissionNo: string; firstName: string; lastName: string };
  payments: Payment[];
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: inv, isLoading } = useSWR<Invoice>(
    mounted && !!getAccessToken() ? `/fees/invoices/${id}/receipt` : null,
    (url: string) => apiClient.get<Invoice>(url),
  );

  if (isLoading) return <div className="p-8 text-text-500 text-sm">Loading receipt…</div>;
  if (!inv) return <div className="p-8 text-text-500 text-sm">Receipt not found.</div>;

  const balance = inv.amountDue - inv.amountPaid;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-border shadow-sm p-8 space-y-6 print:shadow-none print:border-none">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-900">SPIRA Demo School</h1>
            <p className="text-text-500 text-sm">Fee Receipt</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${inv.status === "paid" ? "bg-green-100 text-green-700" : inv.status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {inv.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm border-t border-surface-100 pt-4">
          <div>
            <p className="text-text-400 text-xs uppercase tracking-wide">Invoice No.</p>
            <p className="font-mono font-medium text-text-900">{inv.invoiceNo}</p>
          </div>
          <div>
            <p className="text-text-400 text-xs uppercase tracking-wide">Issued</p>
            <p className="text-text-900">{new Date(inv.issuedAt).toLocaleDateString("en-IN", { timeZone: "UTC" })}</p>
          </div>
          {inv.studentProfile && (
            <div className="col-span-2">
              <p className="text-text-400 text-xs uppercase tracking-wide">Student</p>
              <p className="font-medium text-text-900">{inv.studentProfile.firstName} {inv.studentProfile.lastName} ({inv.studentProfile.admissionNo})</p>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-text-400 text-xs uppercase tracking-wide">Fee Plan</p>
            <p className="text-text-900">{inv.feePlan.name}</p>
            {inv.feePlan.description && <p className="text-text-400 text-xs">{inv.feePlan.description}</p>}
          </div>
        </div>

        <div className="border-t border-surface-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-600">Amount Due</span>
            <span className="font-medium">{inv.feePlan.currency} {inv.amountDue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-600">Amount Paid</span>
            <span className="font-medium text-green-700">{inv.feePlan.currency} {inv.amountPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-surface-100 pt-2">
            <span>Balance</span>
            <span className={balance > 0 ? "text-red-600" : "text-green-700"}>{inv.feePlan.currency} {balance.toLocaleString()}</span>
          </div>
        </div>

        {inv.payments.length > 0 && (
          <div className="border-t border-surface-100 pt-4">
            <p className="text-text-400 text-xs uppercase tracking-wide mb-3">Payment History</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-400 border-b border-surface-100">
                  <th className="text-left py-1">Date</th>
                  <th className="text-left py-1">Method</th>
                  <th className="text-left py-1">Reference</th>
                  <th className="text-right py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.payments.map((p) => (
                  <tr key={p.id} className="border-b border-surface-50">
                    <td className="py-1.5 text-text-600">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { timeZone: "UTC" }) : "—"}</td>
                    <td className="py-1.5 text-text-600 capitalize">{p.method.replace("_", " ")}</td>
                    <td className="py-1.5 font-mono text-text-400">{p.referenceNo ?? "—"}</td>
                    <td className="py-1.5 text-right font-medium">{inv.feePlan.currency} {p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-center pt-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors print:hidden"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
