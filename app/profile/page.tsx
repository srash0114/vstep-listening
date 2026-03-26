"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import { User } from "@/types";
import { useLang } from "@/lib/lang";

export default function Profile() {
  const router = useRouter();
  const { t } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.checkStatus()
      .then((res) => {
        if (res.success && res.data) {
          setUser({ ...res.data, isLoggedIn: true });
        } else {
          clearAuth();
          router.push("/login");
        }
      })
      .catch(() => { clearAuth(); router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-violet)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("Đang tải...", "Loading...")}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.username?.slice(0, 2).toUpperCase() ?? "?";
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(t("vi-VN", "en-US"), { year: "numeric", month: "long" })
    : null;

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 60%), var(--bg-base)",
      }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Profile header card */}
        <div
          className="rounded-3xl overflow-hidden mb-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Banner */}
          <div
            className="h-36 relative"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(6,182,212,0.3) 50%, rgba(16,185,129,0.2) 100%)",
            }}
          >
            {/* Mesh pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          <div className="px-8 pb-8">
            {/* Avatar row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 mb-6">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                    border: "3px solid var(--bg-surface)",
                  }}
                >
                  {initials}
                </div>
                <div className="mb-1">
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {user.username}
                  </h1>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:mb-1">
                {joinDate && (
                  <span
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t("Tham gia", "Joined")} {joinDate}
                  </span>
                )}
                <span
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t("Hoạt động", "Active")}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "0", label: t("Đề đã làm", "Tests taken"), icon: "📋", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
                { value: "0%", label: t("Điểm TB", "Avg score"), icon: "🎯", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
                { value: "0", label: t("Hoàn thành", "Completed"), icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-5 text-center"
                  style={{ background: stat.bg, border: `1px solid ${stat.bg.replace("0.1", "0.2")}` }}
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-black mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Account info */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              {t("Thông tin tài khoản", "Account Info")}
            </h2>
            <div className="space-y-4">
              {[
                { label: t("Tên đăng nhập", "Username"), value: user.username, icon: "◎" },
                { label: "Email", value: user.email, icon: "◈" },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: "var(--accent-violet-light)" }}>{icon}</span>
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity placeholder */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              {t("Lịch sử làm bài", "Test History")}
            </h2>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                🎧
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                {t("Chưa có bài làm nào", "No tests yet")}
              </p>
              <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
                {t("Bắt đầu làm đề thi để theo dõi tiến độ", "Start a test to track your progress")}
              </p>
              <a
                href="/"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                {t("Xem đề thi →", "View exams →")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
