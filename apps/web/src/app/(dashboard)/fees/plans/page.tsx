"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface FeePlan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  _count: { invoices: number };
}

export default function FeePlansPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");

  useEffect(() => { setMounted(true); }, []);

  const { data: plans, isLoading } = useSWR<FeePlan[]>(
    mounted && !!getAccessToken() ? "/fees/plans" : null,
    (url: string) => apiClient.get<FeePlan[]>(url),
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !amount) { setError("Name and amount are required."); return; }
    setSaving(true);
    try {
      await apiClient.post("/fees/plans", {
        name,
        description: description || undefined,
        amount: Number(amount),
        currency,
        isActive: true,
      });
      setShowForm(false);
      setName(""); setDescription(""); setAmount(""); setCurrency("INR");
      mutate("/fees/plans");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Fee Plans</h1>
          <p className="text-text-500 text-sm mt-0.5">{plans?.length ?? 0} plans</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 transition-colors"
        >
          + New Plan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-border shadow-sm p-5 space-y-4 max-w-lg">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Name</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Term 1 Tuition Fee"
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Description</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-700 mb-1">Amount</label>
              <input
                type="number" min={0} step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="15000"
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-700 mb-1">Currency</label>
              <select
                value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spira-500"
              >
                {["INR", "USD", "GBP", "EUR"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-spira-700 rounded-md hover:bg-spira-800 disabled:opacity-50 transition-colors">
              {saving ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm border border-border rounded-md hover:bg-surface-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm" role="grid" aria-label="Fee plans">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Name</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Description</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Amount</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Invoices</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-text-500 text-xs uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-100 rounded animate-pulse w-24" /></td>
                  ))}
                </tr>
              ))
              : plans?.length === 0
                ? <tr><td colSpan={5} className="px-4 py-12 text-center text-text-500">No fee plans yet</td></tr>
                : plans?.map((p) => (
                  <tr key={p.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-900">{p.name}</td>
                    <td className="px-4 py-3 text-text-500">{p.description ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-text-900">{p.currency} {p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-500">{p._count.invoices}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-surface-100 text-text-500"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
