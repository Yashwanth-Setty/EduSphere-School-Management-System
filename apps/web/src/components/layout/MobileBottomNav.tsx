"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { NAV_ITEMS, ROLE_BOTTOM_TABS } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { clearAuthTokens } from "@/lib/auth";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const userRoles = (user?.roles ?? []) as Role[];
  const primaryRole = userRoles[0] ?? Role.STUDENT;

  // All nav items visible to this user
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => userRoles.includes(r)),
  );

  // Bottom tab hrefs for this role
  const tabHrefs = ROLE_BOTTOM_TABS[primaryRole] ?? ["/dashboard"];
  const bottomItems = tabHrefs
    .map((href) => visibleItems.find((item) => item.href === href))
    .filter(Boolean) as typeof visibleItems;

  // "More" items = visible items that aren't in bottom tabs
  const moreItems = visibleItems.filter(
    (item) => !tabHrefs.includes(item.href),
  );

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const handleLogout = async () => {
    setMoreOpen(false);
    try { await apiClient.post("/auth/logout", {}); } catch { /* ignore */ }
    clearAuthTokens();
    router.push("/login");
  };

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch h-16">
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors active:opacity-70",
                  active ? "text-spira-700" : "text-text-500",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors active:opacity-70",
              moreOpen ? "text-spira-700" : "text-text-500",
            )}
            aria-label="More navigation options"
          >
            <span className="text-xl leading-none">⋯</span>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-50"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 shadow-md overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            role="dialog"
            aria-label="More options"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-surface-200 rounded-full" />
            </div>

            <div className="px-4 pb-2">
              <p className="text-xs font-semibold text-text-500 uppercase tracking-wide mb-3 mt-2">
                More
              </p>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {moreItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors active:opacity-70",
                        active ? "bg-spira-500/10" : "bg-surface-50",
                      )}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className={cn("text-[10px] font-medium text-center leading-tight", active ? "text-spira-800" : "text-text-600")}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-surface-100 pt-3 pb-2">
                <div className="px-1 mb-2">
                  <p className="text-sm font-medium text-text-900">{user?.displayName}</p>
                  <p className="text-xs text-text-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm text-danger font-medium rounded-xl active:bg-surface-50 transition-colors"
                >
                  <span>🚪</span> Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
