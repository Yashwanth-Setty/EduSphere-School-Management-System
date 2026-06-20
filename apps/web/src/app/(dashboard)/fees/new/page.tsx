"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface FeePlan { id: string; name: string; amount: number; currency: string }
interface Student { id: string; admissionNo: string; firstName: string; lastName: string }

export default function NewInvoicePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [feePlanId, setFeePlanId] = useState("");
  const [studentProfileId, setStudentProfileId] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const { data: plans } = useSWR<FeePlan[]>(
    mounted && !!getAccessToken() ? "/fees/plans" : null,
    (url: string) => apiClient.get<FeePlan[]>(url),
  );

  const { data: studentsData } = useSWR<{ data: Student[] }>(
    mounted && !!getAccessToken() ? "/students?pageSize=200" : null,
    (url: string) => apiClient.get<{ data: Student[] }>(url),
  );

  const selectedPlan = plans?.find((p) => p.id === feePlanId);

  useEffect(() => {
    if (selectedPlan) setAmountDue(String(selectedPlan.amount));
  }, [selectedPlan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!feePlanId || !studentProfileId || !amountDue || !dueDate) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      const inv = await apiClient.post<{ id: string }>("/fees/invoices", {
        feePlanId,
        studentProfileId,
        amountDue: Number(amountDue),
        dueDate,
      });
      router.push(`/fees/${inv.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-900">New Invoice</h1>
        <p className="text-text-500 text-sm mt-0.5">Generate a fee invoice for a student</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border shadow-sm p-6 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Fee Plan</label>
          <select
            value={feePlanId}
            onChange={(e) => setFeePlanId(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
          >
            <option value="">Select fee planâ€¦</option>
            {plans?.map((p) => (
              <option key={p.id} value={p.id}>{p.name} â€” {p.currency} {p.amount.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Student</label>
          <select
            value={studentProfileId}
            onChange={(e) => setStudentProfileId(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
          >
            <option value="">Select studentâ€¦</option>
            {studentsData?.data.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Amount Due</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amountDue}
            onChange={(e) => setAmountDue(e.target.value)}
            placeholder="15000"
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
          />
          {selectedPlan && (
            <p className="text-xs text-text-400 mt-1">Default from plan: {selectedPlan.currency} {selectedPlan.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-700 mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creatingâ€¦" : "Create Invoice"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-text-700 border border-border rounded-md hover:bg-surface-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

