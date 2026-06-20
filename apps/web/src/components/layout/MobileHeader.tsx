"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { clearAuthTokens } from "@/lib/auth";
import { useState } from "react";

const PATH_TITLES: Record<string, string> = {
  "/dashboard":       "Dashboard",
  "/students":        "Students",
  "/staff":           "Staff",
  "/attendance":      "Attendance",
  "/timetable":       "Timetable",
  "/courses":         "Courses",
  "/assignments":     "Assignments",
  "/exams":           "Exams & Results",
  "/fees":            "Fees",
  "/announcements":   "Communication",
  "/documents":       "Documents",
  "/analytics":       "Analytics",
  "/ai":              "AI Insights",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "SPIRA";
  for (const [prefix, title] of Object.entries(PATH_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return title;
  }
  return "SPIRA";
}

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const title = getPageTitle(pathname);
  const initials = user?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const handleLogout = async () => {
    setShowMenu(false);
    try { await apiClient.post("/auth/logout", {}); } catch { /* ignore */ }
    clearAuthTokens();
    router.push("/login");
  };

  return (
    <header className="md:hidden h-14 bg-white border-b border-border flex items-center px-4 shrink-0 z-30">
      {/* Logo mark */}
      <div className="w-7 h-7 rounded-md bg-spira-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
        S
      </div>

      {/* Title */}
      <span className="ml-3 font-semibold text-text-900 text-base flex-1">
        {title}
      </span>

      {/* Profile avatar */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          aria-label="Profile menu"
          className="w-9 h-9 rounded-full bg-spira-700 text-white flex items-center justify-center text-sm font-semibold active:opacity-80"
        >
          {initials}
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-xl shadow-md py-2 z-50">
              <div className="px-4 py-2 border-b border-surface-100">
                <p className="text-sm font-medium text-text-900 truncate">{user?.displayName}</p>
                <p className="text-xs text-text-500 truncate">{user?.email}</p>
                <p className="text-xs text-text-400 capitalize mt-0.5">{user?.roles?.[0]}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-danger active:bg-surface-50"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
