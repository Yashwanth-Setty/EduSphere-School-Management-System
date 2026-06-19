import Cookies from "js-cookie";

const ACCESS_KEY = "spira_access";
const REFRESH_KEY = "spira_refresh";

export function setAuthTokens(access: string, refresh: string) {
  Cookies.set(ACCESS_KEY, access, { sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  Cookies.set(REFRESH_KEY, refresh, { sameSite: "strict", secure: process.env.NODE_ENV === "production" });
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_KEY);
}

export function clearAuthTokens() {
  Cookies.remove(ACCESS_KEY);
  Cookies.remove(REFRESH_KEY);
}
