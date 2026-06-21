"use client";

import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from "./auth";
import { isMockToken, mockGetUserFromToken, mockLogin, isMockCredentials } from "./mock-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

class ApiClient {
  private refreshing: Promise<void> | null = null;

  private async request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    // ── Mock: /auth/login — try demo credentials first ───────────────────────
    if (path === "/auth/login" && method === "POST") {
      const payload = body as { schoolCode: string; email: string; password: string };
      if (isMockCredentials(payload.schoolCode, payload.email, payload.password)) {
        return mockLogin(payload.schoolCode, payload.email, payload.password) as T;
      }
    }

    // ── Mock: /auth/me — if token is a mock token, return user without API call
    if (path === "/auth/me" && method === "GET") {
      const token = getAccessToken() ?? "";
      if (isMockToken(token)) {
        const user = mockGetUserFromToken(token);
        if (!user) throw new Error("Unauthenticated");
        return user as T;
      }
    }

    // ── Mock: /auth/refresh — if token is a mock token, renew without API call
    if (path === "/auth/refresh" && method === "POST") {
      const token = getAccessToken() ?? "";
      if (isMockToken(token)) {
        return { accessToken: token, refreshToken: token, expiresIn: 900 } as T;
      }
    }

    // ── Real API ─────────────────────────────────────────────────────────────
    const token = getAccessToken();
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });

    if (res.status === 401 && retry) {
      await this.attemptRefresh();
      return this.request<T>(method, path, body, false);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? "Request failed");
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  private async attemptRefresh(): Promise<void> {
    if (!this.refreshing) {
      this.refreshing = (async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) { clearAuthTokens(); return; }
        try {
          const data = await this.request<{ accessToken: string; refreshToken: string }>(
            "POST", "/auth/refresh", { refreshToken }, false,
          );
          setAuthTokens(data.accessToken, data.refreshToken ?? refreshToken);
        } catch {
          clearAuthTokens();
        } finally {
          this.refreshing = null;
        }
      })();
    }
    return this.refreshing;
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body: unknown) { return this.request<T>("POST", path, body); }
  put<T>(path: string, body: unknown) { return this.request<T>("PUT", path, body); }
  patch<T>(path: string, body: unknown) { return this.request<T>("PATCH", path, body); }
  delete<T>(path: string) { return this.request<T>("DELETE", path); }
}

export const apiClient = new ApiClient();
