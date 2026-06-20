"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@spira/types";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarNav({ collapsed, onToggle }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRoles = (user?.roles ?? []) as Role[];

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => userRoles.includes(r)),
  );

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-border transition-all duration-200 shrink-0",
        collapsed ? "w-16" : "w-56",
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 border-b border-border px-4", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-md bg-spira-700 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-spira-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
              S
            </div>
            <span className="font-semibold text-text-900 text-sm tracking-tight">SPIRA</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul role="list" className="space-y-0.5">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-spira-500/10 text-spira-900"
                      : "text-text-700 hover:bg-surface-50 hover:text-text-900",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center justify-center p-2 rounded-md text-text-500 hover:bg-surface-50 hover:text-text-900 transition-colors"
        >
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          )}
        </button>
      </div>
    </aside>
  );
}
