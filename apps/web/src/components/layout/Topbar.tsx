"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { clearAuthTokens } from "@/lib/auth";
import { toast } from "sonner";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } catch {
      // silently handle logout errors
    } finally {
      clearAuthTokens();
      router.push("/login");
      toast.success("Signed out successfully");
    }
  };

  const initials = user?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <header className="h-16 bg-white border-b border-border flex items-center gap-4 px-4 shrink-0">
      {/* Menu toggle (mobile) */}
      <button
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
        className="p-2 rounded-md text-text-500 hover:bg-surface-50 hover:text-text-900 transition-colors lg:hidden"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search students, staff, documents…"
            aria-label="Global search"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-border bg-surface-50 text-text-900 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-spira-700 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button
          aria-label="View notifications"
          className="relative p-2 rounded-md text-text-500 hover:bg-surface-50 hover:text-text-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Profile menu */}
        <div className="relative group">
          <button
            aria-label="Open profile menu"
            aria-haspopup="true"
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-spira-700 text-white flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-text-900 leading-tight">{user?.displayName ?? "Loading…"}</p>
              <p className="text-xs text-text-500 capitalize">{(user?.roles?.[0] as string) ?? ""}</p>
            </div>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-md py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="px-3 py-2 border-b border-surface-100">
              <p className="text-xs font-medium text-text-900">{user?.displayName}</p>
              <p className="text-xs text-text-500">{user?.email}</p>
            </div>
            <button
              className="w-full text-left px-3 py-2 text-sm text-text-700 hover:bg-surface-50 transition-colors"
            >
              Profile settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-surface-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
