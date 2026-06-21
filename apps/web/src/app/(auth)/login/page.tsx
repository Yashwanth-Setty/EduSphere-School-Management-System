"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { setAuthTokens, clearAuthTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Clear any stale tokens when arriving at the login page
  useEffect(() => { clearAuthTokens(); }, []);
  const [form, setForm] = useState({ schoolCode: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.schoolCode.trim()) e.schoolCode = "School code is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiClient.post<{ accessToken: string; refreshToken: string; user: { displayName: string } }>("/auth/login", form);
      setAuthTokens(data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.displayName}`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-spira-700 text-white font-bold text-2xl shadow-md mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-text-900">SPIRA</h1>
          <p className="text-text-500 text-sm mt-1">School Parent Interaction & Resource Access</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-border shadow-md p-8">
          <h2 className="text-lg font-semibold text-text-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* School code */}
            <div>
              <label htmlFor="schoolCode" className="block text-sm font-medium text-text-700 mb-1">
                School code <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                id="schoolCode"
                type="text"
                autoComplete="organization"
                value={form.schoolCode}
                onChange={(e) => setForm((f) => ({ ...f, schoolCode: e.target.value }))}
                aria-describedby={errors.schoolCode ? "schoolCode-error" : undefined}
                aria-invalid={!!errors.schoolCode}
                placeholder="e.g. 0000"
                className={`w-full px-3 py-2 text-sm rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-spira-700 ${
                  errors.schoolCode ? "border-danger text-danger" : "border-border"
                }`}
              />
              {errors.schoolCode && (
                <p id="schoolCode-error" role="alert" className="mt-1 text-xs text-danger">
                  {errors.schoolCode}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-700 mb-1">
                Email address <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                placeholder="you@school.edu"
                className={`w-full px-3 py-2 text-sm rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-spira-700 ${
                  errors.email ? "border-danger" : "border-border"
                }`}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-danger">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-text-700">
                  Password <span aria-hidden="true" className="text-danger">*</span>
                </label>
                <Link href="/forgot-password" className="text-xs text-spira-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                  className={`w-full px-3 py-2 pr-10 text-sm rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-spira-700 ${
                    errors.password ? "border-danger" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-500 hover:text-text-900 focus:outline-none focus:ring-1 focus:ring-spira-700 rounded"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-xs text-danger">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold text-white bg-spira-700 rounded-md hover:bg-spira-800 focus:outline-none focus:ring-2 focus:ring-spira-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-500 mt-6">
          Need access?{" "}
          <a href="#contact" className="text-spira-700 hover:underline">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  );
}
