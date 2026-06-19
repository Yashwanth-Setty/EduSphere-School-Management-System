import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

class ApiClient {
  private refreshing: Promise<void> | null = null;

  private async request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
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
        if (!refreshToken) {
          clearAuthTokens();
          return;
        }
        try {
          const data = await this.request<{ accessToken: string; refreshToken: string }>(
            "POST",
            "/auth/refresh",
            { refreshToken },
            false,
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
