"use client";

import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { ParentDashboard } from "@/components/dashboard/ParentDashboard";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-8 bg-surface-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const roles = user.roles as Role[];

  if (roles.includes(Role.ADMIN) || roles.includes(Role.PRINCIPAL) || roles.includes(Role.ACCOUNTANT) || roles.includes(Role.COUNSELOR)) {
    return <AdminDashboard user={user} />;
  }
  if (roles.includes(Role.TEACHER)) {
    return <TeacherDashboard user={user} />;
  }
  if (roles.includes(Role.STUDENT)) {
    return <StudentDashboard user={user} />;
  }
  if (roles.includes(Role.PARENT)) {
    return <ParentDashboard user={user} />;
  }

  return <AdminDashboard user={user} />;
}

