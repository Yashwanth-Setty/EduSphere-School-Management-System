"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";

interface TransportRoute {
  id: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string | null;
  capacity: number;
  status: string;
  _count: { assignments: number };
}

interface MyRoute {
  id: string;
  pickupLocation: string;
  dropLocation: string;
  pickupEta: string | null;
  dropEta: string | null;
  route: TransportRoute;
}

const STATUS_STYLE: Record<string, string> = {
  on_route: "bg-blue-100 text-blue-700",
  arrived:  "bg-green-100 text-green-700",
  delayed:  "bg-red-100 text-red-700",
  idle:     "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  on_route: "On Route",
  arrived:  "Arrived",
  delayed:  "Delayed",
  idle:     "Idle",
};

export default function TransportPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as Role[];
  const isStudentOrParent = roles.some((r) => r === Role.STUDENT || r === Role.PARENT);

  const ready = mounted && !!getAccessToken();

  const { data: myRoute } = useSWR<MyRoute | null>(
    ready && isStudentOrParent ? "/transport/my-route" : null,
    (url: string) => apiClient.get<MyRoute | null>(url),
  );

  const { data: routes, isLoading } = useSWR<TransportRoute[]>(
    ready ? "/transport" : null,
    (url: string) => apiClient.get<TransportRoute[]>(url),
  );

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">School Transport</h1>
          <p className="text-text-500 text-sm mt-0.5">Bus routes and live status</p>
        </div>
        {roles.some((r) => r === Role.ADMIN || r === Role.PRINCIPAL) && (
          <Link href="/transport/new" className="inline-flex items-center gap-2 px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-md hover:bg-spira-800 transition-colors">
            + Add Route
          </Link>
        )}
      </div>

      {/* My bus card */}
      {isStudentOrParent && myRoute && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">My Bus</p>
              <p className="text-lg font-bold">{myRoute.route.routeName}</p>
              <p className="text-blue-100 text-sm mt-0.5">{myRoute.route.vehicleNumber} · {myRoute.route.driverName}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white capitalize">
              {STATUS_LABEL[myRoute.route.status] ?? myRoute.route.status}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-200 text-xs">Pickup</p>
              <p className="font-medium mt-0.5">{myRoute.pickupLocation}</p>
              {myRoute.pickupEta && <p className="text-blue-100 text-xs mt-0.5">ETA {myRoute.pickupEta}</p>}
            </div>
            <div>
              <p className="text-blue-200 text-xs">Drop</p>
              <p className="font-medium mt-0.5">{myRoute.dropLocation}</p>
              {myRoute.dropEta && <p className="text-blue-100 text-xs mt-0.5">ETA {myRoute.dropEta}</p>}
            </div>
          </div>
          {myRoute.route.driverPhone && (
            <p className="mt-3 text-blue-100 text-xs">Driver: {myRoute.route.driverPhone}</p>
          )}
        </div>
      )}

      {/* All routes */}
      <section>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">All Routes</h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <div key={i} className="h-28 bg-surface-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (routes ?? []).length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center">
            <p className="text-4xl mb-3">🚌</p>
            <p className="text-text-500 text-sm">No transport routes configured yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {(routes ?? []).map((route) => (
              <Link key={route.id} href={`/transport/${route.id}`} className="bg-white rounded-xl border border-border p-5 hover:border-spira-400 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-900 group-hover:text-spira-700 transition-colors truncate">{route.routeName}</p>
                    <p className="text-sm text-text-500 mt-0.5">{route.vehicleNumber}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[route.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[route.status] ?? route.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-400">Driver</p>
                    <p className="text-text-700">{route.driverName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-400">Students</p>
                    <p className="text-text-700">{route._count.assignments} / {route.capacity}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
