"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import { validateEmail, validatePassword } from "@/lib/utils";
import Alert from "@/components/Alert";
import { useLang } from "@/lib/lang";

export default function Register() {
  const router = useRouter();
  const { t } = useLang();
  const [formData, setFormData] = useState({
    username: "", email: "", full_name: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = t("Tên đăng nhập là bắt buộc", "Username is required");
    if (!formData.full_name.trim()) newErrors.full_name = t("Tên đầy đủ là bắt buộc", "Full name is required");
    if (!validateEmail(formData.email)) newErrors.email = t("Email không hợp lệ", "Invalid email");
    const pwv = validatePassword(formData.password);
    if (!pwv.valid) newErrors.password = pwv.message || "";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t("Mật khẩu không khớp", "Passwords do not match");
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
      const response = await usersApi.register(formData.username, formData.email, formData.full_name, formData.password);
      if (response.success && response.data) {
        setAlert({ type: "success", message: "Tài khoản đã được tạo! Đang chuyển đến trang đăng nhập..." });
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setAlert({ type: "error", message: response.message || "Đăng ký thất bại." });
      }
    } catch (error: any) {
      let msg = "Đăng ký thất bại.";
      if (error.response?.data?.message) msg = error.response.data.message;
      else if (error.message) msg = error.message;
      setAlert({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: string) => ({
    background: "var(--bg-elevated)",
    border: `1px solid ${errors[field] ? "rgba(244,63,94,0.5)" : "var(--border-default)"}`,
    color: "var(--text-primary)",
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    (e.target as HTMLElement).style.border = errors[field]
      ? "1px solid rgba(244,63,94,0.7)"
      : "1px solid rgba(124,58,237,0.5)";
    (e.target as HTMLElement).style.boxShadow = errors[field]
      ? "0 0 0 3px rgba(244,63,94,0.1)"
      : "0 0 0 3px rgba(124,58,237,0.1)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    (e.target as HTMLElement).style.border = errors[field] ? "1px solid rgba(244,63,94,0.5)" : "1px solid var(--border-default)";
    (e.target as HTMLElement).style.boxShadow = "none";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.12) 0%, transparent 60%), var(--bg-base)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden transition-transform duration-300 group-hover:scale-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="VSTEP" width={48} height={48} className="w-12 h-12 object-contain" />
            </div>
          </Link>
          <h1
            className="text-3xl font-black mt-6 mb-2 tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t("Tạo tài khoản", "Create account")}
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-sm">
            {t("Tham gia và bắt đầu luyện tập ngay hôm nay", "Join and start practicing today")}
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
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-bl-[80px] pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }}
          />

          {alert && (
            <div className="mb-6">
              <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            {/* Fields config */}
            {[
              {
                name: "username", label: t("Tên đăng nhập", "Username"), type: "text", placeholder: t("Chọn tên đăng nhập", "Choose a username"),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
              },
              {
                name: "full_name", label: t("Tên đầy đủ", "Full Name"), type: "text", placeholder: t("Nguyễn Văn A", "John Doe"),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
              },
              {
                name: "email", label: "Email", type: "email", placeholder: "you@example.com",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
              },
            ].map(({ name, label, type, placeholder, icon }) => (
              <div key={name} className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {label}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {icon}
                    </svg>
                  </div>
                  <input
                    type={type}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={inputStyle(name)}
                    onFocus={(e) => handleFocus(e, name)}
                    onBlur={(e) => handleBlur(e, name)}
                  />
                </div>
                {errors[name] && <p className="text-xs" style={{ color: "#fb7185" }}>{errors[name]}</p>}
              </div>
            ))}

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
                  placeholder={t("Ít nhất 6 ký tự", "At least 6 characters")}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle("password")}
                  onFocus={(e) => handleFocus(e, "password")}
                  onBlur={(e) => handleBlur(e, "password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: "#fb7185" }}>{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("Xác nhận mật khẩu", "Confirm password")}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t("Nhập lại mật khẩu", "Re-enter password")}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle("confirmPassword")}
                  onFocus={(e) => handleFocus(e, "confirmPassword")}
                  onBlur={(e) => handleBlur(e, "confirmPassword")}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs" style={{ color: "#fb7185" }}>{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 mt-2"
              style={{
                background: submitting ? "rgba(6,182,212,0.4)" : "linear-gradient(135deg, #06b6d4, #7c3aed)",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("Đang tạo tài khoản...", "Creating account...")}
                </span>
              ) : t("Tạo tài khoản →", "Create account →")}
            </button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("Đã có tài khoản?", "Already have an account?")}</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            {t("Đăng nhập", "Sign in")}
          </Link>
        </div>
      </div>
    </div>
  );
}
