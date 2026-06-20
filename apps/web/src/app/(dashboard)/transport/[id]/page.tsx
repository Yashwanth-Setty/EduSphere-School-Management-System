"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface Route {
  id: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string | null;
  capacity: number;
  status: string;
  assignments: Array<{
    id: string;
    pickupLocation: string;
    dropLocation: string;
    pickupEta: string | null;
    studentProfile: { firstName: string; lastName: string; admissionNo: string };
  }>;
}

const STATUS_LABEL: Record<string, string> = {
  on_route: "On Route",
  arrived:  "Arrived",
  delayed:  "Delayed",
  idle:     "Idle",
};

const STATUS_STYLE: Record<string, string> = {
  on_route: "bg-blue-100 text-blue-700",
  arrived:  "bg-green-100 text-green-700",
  delayed:  "bg-red-100 text-red-700",
  idle:     "bg-gray-100 text-gray-600",
};

export default function TransportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: route, isLoading } = useSWR<Route>(
    mounted && !!getAccessToken() ? `/transport/${id}` : null,
    (url: string) => apiClient.get<Route>(url),
  );

  if (isLoading) {
    return <div className="p-4 md:p-6 text-text-500 text-sm animate-pulse">Loading route…</div>;
  }
  if (!route) {
    return <div className="p-4 md:p-6 text-text-500 text-sm">Route not found.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/transport" className="text-sm text-spira-700 hover:underline">← Transport</Link>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-md">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Route</p>
            <h1 className="text-xl font-bold">{route.routeName}</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLE[route.status] ?? "bg-white/20 text-white"}`}>
            {STATUS_LABEL[route.status] ?? route.status}
          </span>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-blue-200 text-xs">Vehicle</p>
            <p className="font-medium mt-0.5">{route.vehicleNumber}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Driver</p>
            <p className="font-medium mt-0.5">{route.driverName}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Capacity</p>
            <p className="font-medium mt-0.5">{route.assignments.length} / {route.capacity} students</p>
          </div>
        </div>
        {route.driverPhone && (
          <p className="mt-3 text-blue-100 text-xs">Contact: {route.driverPhone}</p>
        )}
      </div>

      {/* Student list */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-900 mb-4">Assigned Students ({route.assignments.length})</h2>
        {route.assignments.length === 0 ? (
          <p className="text-sm text-text-500">No students assigned to this route.</p>
        ) : (
          <div className="space-y-3">
            {route.assignments.map((a) => (
              <div key={a.id} className="flex items-start justify-between p-3 rounded-lg bg-surface-50 border border-surface-100">
                <div>
                  <p className="text-sm font-medium text-text-900">{a.studentProfile.firstName} {a.studentProfile.lastName}</p>
                  <p className="text-xs text-text-500 mt-0.5">{a.studentProfile.admissionNo}</p>
                </div>
                <div className="text-right text-xs text-text-400">
                  <p>Pickup: {a.pickupLocation}</p>
                  {a.pickupEta && <p>ETA {a.pickupEta}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
