"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { AuthUser } from "@/types";
import { getAccessToken } from "@/lib/auth";

export function useAuth() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hasToken = mounted && !!getAccessToken();

  const { data: user, error, isLoading } = useSWR<AuthUser>(
    hasToken ? "/auth/me" : null,
    (path: string) => apiClient.get<AuthUser>(path),
    { revalidateOnFocus: false },
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
