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

// Simulated GPS waypoints for Route A (school → pickup zones)
const ROUTE_A_WAYPOINTS = [
  { lat: 18.5204, lng: 73.8567, label: "SPIRA Demo School", type: "school" },
  { lat: 18.5280, lng: 73.8490, label: "Stop 1 – Park Lane", type: "stop" },
  { lat: 18.5330, lng: 73.8420, label: "Stop 2 – Sector 8", type: "stop" },
  { lat: 18.5390, lng: 73.8360, label: "Stop 3 – Sunrise Apts (Ava)", type: "pickup" },
  { lat: 18.5450, lng: 73.8290, label: "Stop 4 – North Gate", type: "stop" },
];
const BUS_POSITION = { lat: 18.5340, lng: 73.8400, label: "Bus Current Position" };

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
          <p className="text-text-500 text-sm mt-0.5">Live bus tracking and route info</p>
        </div>
        {roles.some((r) => r === Role.ADMIN || r === Role.PRINCIPAL) && (
          <Link href="/transport/new" className="inline-flex items-center gap-2 px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-md hover:bg-spira-800 transition-colors">
            + Add Route
          </Link>
        )}
      </div>

      {/* My bus hero card */}
      {isStudentOrParent && myRoute && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">My Bus</p>
              <p className="text-xl font-bold">{myRoute.route.routeName}</p>
              <p className="text-blue-100 text-sm mt-0.5">{myRoute.route.vehicleNumber} · Driver: {myRoute.route.driverName}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              myRoute.route.status === "on_route" ? "bg-yellow-400 text-yellow-900" :
              myRoute.route.status === "arrived"  ? "bg-green-400 text-green-900" : "bg-red-400 text-red-900"
            }`}>
              {myRoute.route.status === "on_route" ? "🚌 On Route" : myRoute.route.status === "arrived" ? "✅ Arrived" : "⚠ Delayed"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-300 text-xs font-medium uppercase tracking-wide">Pickup Point</p>
              <p className="font-medium mt-0.5">{myRoute.pickupLocation}</p>
              {myRoute.pickupEta && <p className="text-blue-200 text-xs mt-0.5">📍 ETA {myRoute.pickupEta} AM</p>}
            </div>
            <div>
              <p className="text-blue-300 text-xs font-medium uppercase tracking-wide">Drop Point</p>
              <p className="font-medium mt-0.5">{myRoute.dropLocation}</p>
              {myRoute.dropEta && <p className="text-blue-200 text-xs mt-0.5">📍 ETA {myRoute.dropEta} PM</p>}
            </div>
          </div>
          {myRoute.route.driverPhone && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-blue-200 text-xs">📞 {myRoute.route.driverPhone}</span>
            </div>
          )}
        </div>
      )}

      {/* Live Map */}
      {isStudentOrParent && myRoute && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-900">🗺 Live Route Map</h2>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
              Live
            </span>
          </div>
          <LiveMap />
        </div>
      )}

      {/* Stats row */}
      {isStudentOrParent && myRoute && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Next Stop ETA", value: "~8 min", icon: "⏱" },
            { label: "Distance Left", value: "3.2 km", icon: "📏" },
            { label: "Students on Bus", value: `${myRoute.route._count?.assignments ?? 1}`, icon: "👥" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-3 text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-lg font-bold text-text-900">{s.value}</p>
              <p className="text-xs text-text-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* All routes */}
      <section>
        <h2 className="text-sm font-semibold text-text-700 uppercase tracking-wide mb-3">All Routes</h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <div key={i} className="h-28 bg-surface-100 rounded-xl animate-pulse" />)}
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

function LiveMap() {
  const [step, setStep] = useState(0);

  // Animate bus position along the route
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 100), 200);
    return () => clearInterval(t);
  }, []);

  // SVG viewport: map Pune coordinates to 800x400 canvas
  const toX = (lng: number) => ((lng - 73.820) / (73.860 - 73.820)) * 780 + 10;
  const toY = (lat: number) => 390 - ((lat - 18.510) / (18.560 - 18.510)) * 380;

  const waypoints = ROUTE_A_WAYPOINTS;
  // Interpolate bus position between stop 2 and 3
  const busProgress = (step % 100) / 100;
  const p1 = waypoints[2];
  const p2 = waypoints[3];
  const busX = toX(p1.lng + (p2.lng - p1.lng) * busProgress);
  const busY = toY(p1.lat + (p2.lat - p1.lat) * busProgress);

  return (
    <div className="relative bg-slate-100" style={{ height: 340 }}>
      <svg width="100%" height="340" viewBox="0 0 800 340" preserveAspectRatio="xMidYMid meet">
        {/* Road-style background */}
        <rect width="800" height="340" fill="#e8edf2" />
        {/* Grid lines for map feel */}
        {[0,1,2,3,4].map(i => (
          <line key={`h${i}`} x1="0" y1={i*85} x2="800" y2={i*85} stroke="#d1d9e0" strokeWidth="0.5"/>
        ))}
        {[0,1,2,3,4,5,6,7].map(i => (
          <line key={`v${i}`} x1={i*114} y1="0" x2={i*114} y2="340" stroke="#d1d9e0" strokeWidth="0.5"/>
        ))}

        {/* Route path */}
        <polyline
          points={waypoints.map(w => `${toX(w.lng)},${toY(w.lat)}`).join(" ")}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 4"
        />
        {/* Completed path (solid blue) */}
        <polyline
          points={waypoints.slice(0, 3).map(w => `${toX(w.lng)},${toY(w.lat)}`).join(" ")}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Stop markers */}
        {waypoints.map((w, i) => {
          const x = toX(w.lng);
          const y = toY(w.lat);
          const isSchool = w.type === "school";
          const isPickup = w.type === "pickup";
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={isSchool ? 12 : isPickup ? 10 : 7}
                fill={isSchool ? "#1d4ed8" : isPickup ? "#f59e0b" : "#6366f1"}
                stroke="white" strokeWidth="2" />
              {isSchool && <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold">S</text>}
              {isPickup && <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold">★</text>}
              <rect x={x+14} y={y-10} width={w.label.length * 5.8 + 8} height="18" rx="4" fill="white" fillOpacity="0.9" />
              <text x={x+18} y={y+1} dominantBaseline="middle" fill="#1e293b" fontSize="9" fontWeight="500">{w.label}</text>
            </g>
          );
        })}

        {/* Animated bus */}
        <g transform={`translate(${busX},${busY})`}>
          <circle r="14" fill="#ef4444" stroke="white" strokeWidth="3" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize="14">🚌</text>
        </g>

        {/* Legend */}
        <rect x="10" y="290" width="200" height="42" rx="6" fill="white" fillOpacity="0.9" />
        <circle cx="24" cy="304" r="6" fill="#1d4ed8" />
        <text x="35" y="308" fill="#374151" fontSize="9">School</text>
        <circle cx="80" cy="304" r="6" fill="#f59e0b" />
        <text x="91" y="308" fill="#374151" fontSize="9">Your Stop</text>
        <circle cx="145" cy="304" r="6" fill="#6366f1" />
        <text x="156" y="308" fill="#374151" fontSize="9">Bus Stop</text>
        <circle cx="24" cy="322" r="8" fill="#ef4444" stroke="white" strokeWidth="2" />
        <text x="24" y="323" textAnchor="middle" dominantBaseline="middle" fontSize="9">🚌</text>
        <text x="37" y="326" fill="#374151" fontSize="9">Bus (live)</text>
      </svg>
      {/* ETA overlay */}
      <div className="absolute top-3 right-3 bg-white rounded-xl shadow-md px-3 py-2 text-xs">
        <p className="font-bold text-blue-700">ETA to Your Stop</p>
        <p className="text-2xl font-black text-text-900">~8 min</p>
        <p className="text-text-400">Updated just now</p>
      </div>
    </div>
  );
}
