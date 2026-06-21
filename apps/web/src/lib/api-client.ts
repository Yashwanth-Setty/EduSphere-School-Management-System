import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from "./auth";
import { isMockToken, mockGetUserFromToken, mockLogin } from "./mock-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// Use mock auth when no real API URL is configured (i.e. deployed without a backend)
const IS_DEMO = !process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private refreshing: Promise<void> | null = null;

  private async request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    // ── Mock intercepts ──────────────────────────────────────────────────────
    if (IS_DEMO || isMockToken(getAccessToken() ?? "")) {
      if (path === "/auth/login" && method === "POST") {
        const { schoolCode, email, password } = body as { schoolCode: string; email: string; password: string };
        return mockLogin(schoolCode, email, password) as T;
      }
      if (path === "/auth/me" && method === "GET") {
        const token = getAccessToken() ?? "";
        const user = isMockToken(token) ? mockGetUserFromToken(token) : null;
        if (!user) throw new Error("Unauthenticated");
        return user as T;
      }
      if (path === "/auth/refresh") {
        const token = getAccessToken() ?? "";
        if (isMockToken(token)) return { accessToken: token, refreshToken: token, expiresIn: 900 } as T;
      }
      if (path.startsWith("/auth/logout")) return undefined as T;
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
