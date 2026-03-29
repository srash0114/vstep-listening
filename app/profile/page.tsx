"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { testsApi, userExamsApi } from "@/lib/api";
import { UserResultsHistory } from "@/types";
import { useLang } from "@/lib/lang";
import { useAuth } from "@/lib/auth-context";

export default function Profile() {
  const router = useRouter();
  const { t } = useLang();
  const [history, setHistory] = useState<UserResultsHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { user } = useAuth();

  const handleDelete = async (userExamId: number) => {
    setDeletingId(userExamId);
    try {
      await userExamsApi.delete(userExamId);
      setHistory((prev) => {
        if (!prev) return prev;
        const results = (prev.results as any[]).filter((r: any) => r.userExamId !== userExamId);
        const scores = results.map((r: any) => r.score);
        const totalTests = results.length;
        const averageScore = totalTests > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / totalTests : 0;
        const bestScore = totalTests > 0 ? Math.max(...scores) : 0;
        return { ...prev, totalTests, averageScore, bestScore, results } as any;
      });
    } catch (e) {
      console.error("Failed to delete:", e);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };
  useEffect(() => {
    const loadUserHistory = async () => {
      try {
        setHistoryLoading(true);
        const res = await testsApi.getUserHistory();
        const rawItems: any[] = Array.isArray(res.data)
          ? res.data
          : (res as any)?.data?.data || [];

        // Chỉ lấy bài đã nộp
        const submitted = rawItems.filter((item: any) => item.submitted_at !== null);

        const scores = submitted.map((item: any) => parseFloat(item.score) || 0);
        const totalTests = submitted.length;
        const averageScore = totalTests > 0 ? scores.reduce((a, b) => a + b, 0) / totalTests : 0;
        const bestScore = totalTests > 0 ? Math.max(...scores) : 0;

        const results = submitted.map((item: any) => ({
          testId: item.exam_id,
          userExamId: item.id,
          score: parseFloat(item.score) || 0,
          percentage: parseFloat(item.score) || 0,
          correctAnswers: item.correct_answers ?? 0,
          totalQuestions: item.total_questions ?? 0,
          submittedAt: item.submitted_at,
          timeSpent: item.time_spent,
        }));

        setHistory({ totalTests, averageScore, bestScore, results } as any);
      } catch (error) {
        console.error("Failed to load user history:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadUserHistory();
  }, []);

  if (historyLoading) {
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

  if (!user) {
    return null;
  }

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
                { value: history?.totalTests?.toString() || "0", label: t("Đề đã làm", "Tests taken"), icon: "📋", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
                { value: `${history?.averageScore?.toFixed(1) || "0"}%`, label: t("Điểm TB", "Avg score"), icon: "🎯", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
                { value: `${history?.bestScore?.toFixed(1) || "0"}%`, label: t("Điểm cao nhất", "Best score"), icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
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
            
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-violet)" }}
                />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("Đang tải...", "Loading...")}</p>
              </div>
            ) : history && history.results && history.results.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(history.results as any[]).map((result, idx) => {
                  const pct = result.percentage ?? 0;
                  const pctColor = pct >= 80 ? "#10b981" : pct >= 60 ? "#3b82f6" : "#ef4444";
                  const pctBg = pct >= 80 ? "rgba(16,185,129,0.2)" : pct >= 60 ? "rgba(59,130,246,0.2)" : "rgba(239,68,68,0.2)";
                  return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-opacity-75"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                          {t("Đề thi", "Test")} #{result.testId}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: pctBg, color: pctColor }}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {result.correctAnswers}/{result.totalQuestions} {t("câu đúng", "correct")}
                        {result.submittedAt && (
                          <> · {new Date(result.submittedAt).toLocaleDateString(t("vi-VN", "en-US"), {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <a
                        onClick={() => router.push(`/test/${result.testId}/review?ueid=${result.userExamId}`)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80 cursor-pointer"
                        style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
                      >
                        {t("Xem lại", "Review")}
                      </a>
                      {confirmDeleteId === result.userExamId ? (
                        <>
                          <button
                            onClick={() => handleDelete(result.userExamId)}
                            disabled={deletingId === result.userExamId}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                            style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}
                          >
                            {deletingId === result.userExamId ? "..." : t("Xác nhận", "Confirm")}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                            style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                          >
                            {t("Hủy", "Cancel")}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(result.userExamId)}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                          title={t("Xóa", "Delete")}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
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
                  onClick={() => router.push("/")}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
                >
                  {t("Xem đề thi →", "View exams →")}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
