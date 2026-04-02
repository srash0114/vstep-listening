"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usersApi, API_BASE_URL } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";
import Alert from "@/components/Alert";
import { useLang } from "@/lib/lang";

export default function Login() {
  const router = useRouter();
  const { t } = useLang();
  const [loginMode, setLoginMode] = useState<"email" | "username">("email");
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleModeSwitch = (mode: "email" | "username") => {
    setLoginMode(mode);
    setFormData({ identifier: "", password: "" });
    setErrors({});
    setAlert(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = loginMode === "email"
        ? t("Vui lòng nhập email", "Please enter your email")
        : t("Vui lòng nhập tên đăng nhập", "Please enter your username");
    }
    if (!formData.password) newErrors.password = t("Vui lòng nhập mật khẩu", "Please enter your password");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const response = await usersApi.login(formData.identifier.trim(), formData.password, loginMode);
      if (response.success && response.data) {
        setStoredUser(response.data);
        setAlert({ type: "success", message: "Đăng nhập thành công! Đang chuyển hướng..." });
        setTimeout(() => window.location.href = "/", 900);
      } else {
        setAlert({ type: "error", message: response.message || "Đăng nhập thất bại." });
      }
    } catch (error: any) {
      let msg = "Đăng nhập thất bại.";
      if (error.response?.data?.message) msg = error.response.data.message;
      else if (error.message) msg = error.message;
      setAlert({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 60%), var(--bg-base)",
      }}
    >
      {/* Decorative element */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.4), transparent)" }}
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z"/>
              </svg>
            </div>
          </Link>
          <h1
            className="text-3xl font-black mt-6 mb-2 tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t("Chào mừng trở lại", "Welcome back")}
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-sm">
            {t("Tiếp tục hành trình luyện tập của bạn", "Continue your practice journey")}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Subtle gradient corner */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-bl-[80px] pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)" }}
          />

          {alert && (
            <div className="mb-6">
              <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            </div>
          )}

          {/* Mode tabs */}
          <div
            className="flex rounded-xl p-1 mb-6 relative"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {(["email", "username"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeSwitch(mode)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: loginMode === mode ? "linear-gradient(135deg, #7c3aed, #06b6d4)" : "transparent",
                  color: loginMode === mode ? "#fff" : "var(--text-muted)",
                }}
              >
                {mode === "email" ? t("Email", "Email") : t("Tên đăng nhập", "Username")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            {/* Identifier field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {loginMode === "email" ? "Email" : t("Tên đăng nhập", "Username")}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {loginMode === "email"
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    }
                  </svg>
                </div>
                <input
                  type={loginMode === "email" ? "email" : "text"}
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder={loginMode === "email" ? "you@example.com" : t("tên đăng nhập", "your username")}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: "var(--bg-elevated)",
                    border: `1px solid ${errors.identifier ? "rgba(244,63,94,0.5)" : "var(--border-default)"}`,
                    color: "var(--text-primary)",
                  }}
                  onFocus={e => {
                    (e.target as HTMLElement).style.border = errors.identifier
                      ? "1px solid rgba(244,63,94,0.7)"
                      : "1px solid rgba(124,58,237,0.5)";
                    (e.target as HTMLElement).style.boxShadow = errors.identifier
                      ? "0 0 0 3px rgba(244,63,94,0.1)"
                      : "0 0 0 3px rgba(124,58,237,0.1)";
                  }}
                  onBlur={e => {
                    (e.target as HTMLElement).style.border = errors.identifier ? "1px solid rgba(244,63,94,0.5)" : "1px solid var(--border-default)";
                    (e.target as HTMLElement).style.boxShadow = "none";
                  }}
                />
              </div>
              {errors.identifier && <p className="text-xs" style={{ color: "#fb7185" }}>{errors.identifier}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("Mật khẩu", "Password")}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: "var(--bg-elevated)",
                    border: `1px solid ${errors.password ? "rgba(244,63,94,0.5)" : "var(--border-default)"}`,
                    color: "var(--text-primary)",
                  }}
                  onFocus={e => {
                    (e.target as HTMLElement).style.border = errors.password
                      ? "1px solid rgba(244,63,94,0.7)"
                      : "1px solid rgba(124,58,237,0.5)";
                    (e.target as HTMLElement).style.boxShadow = errors.password
                      ? "0 0 0 3px rgba(244,63,94,0.1)"
                      : "0 0 0 3px rgba(124,58,237,0.1)";
                  }}
                  onBlur={e => {
                    (e.target as HTMLElement).style.border = errors.password ? "1px solid rgba(244,63,94,0.5)" : "1px solid var(--border-default)";
                    (e.target as HTMLElement).style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    }
                    {!showPassword && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: "#fb7185" }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 mt-2 relative overflow-hidden"
              style={{
                background: submitting
                  ? "rgba(124,58,237,0.5)"
                  : "linear-gradient(135deg, #7c3aed, #06b6d4)",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("Đang đăng nhập...", "Signing in...")}
                </span>
              ) : t("Đăng nhập →", "Sign in →")}
            </button>
          </form>

          {/* Google Login */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("hoặc", "or")}</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <a
            href={`${API_BASE_URL}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("Đăng nhập bằng Google", "Continue with Google")}
          </a>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("Chưa có tài khoản?", "Don't have an account?")}</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <Link
            href="/register"
            className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            {t("Tạo tài khoản mới", "Create new account")}
          </Link>
        </div>
      </div>
    </div>
  );
}
