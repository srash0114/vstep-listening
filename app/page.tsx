"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { useLang } from "@/lib/lang";

interface Exam {
  id: number;
  title: string;
  description?: string;
  level?: string;
  total_duration?: number;
  total_questions?: number;
}

const LEVEL_CONFIG: Record<string, { gradient: string; text: string; bg: string }> = {
  "B1":    { gradient: "from-emerald-500 to-teal-500",   text: "#10b981", bg: "rgba(16,185,129,0.1)" },
  "B2":    { gradient: "from-blue-500 to-cyan-500",      text: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  "B1-B2": { gradient: "from-violet-500 to-blue-500",    text: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  "C1":    { gradient: "from-purple-500 to-pink-500",    text: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  "C2":    { gradient: "from-rose-500 to-orange-500",    text: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
};

const DEFAULT_LEVEL = { gradient: "from-slate-500 to-slate-400", text: "#94a3b8", bg: "rgba(148,163,184,0.1)" };

export default function Home() {
  const { t } = useLang();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testsApi
      .getAll()
      .then((res) => {
        if (res.success) {
          const raw = res.data as any;
          setExams(Array.isArray(raw) ? raw : raw?.exams || raw?.data || []);
        } else {
          setError(res.message || t("Không tải được danh sách đề thi", "Failed to load exams"));
        }
      })
      .catch((err: any) => setError(err?.message || t("Không tải được danh sách đề thi", "Failed to load exams")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen mesh-bg">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(124,58,237,0.15)" }}
        />
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(6,182,212,0.1)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 fade-up"
              style={{
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#a78bfa",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              VSTEP English Listening Practice
            </div>

            {/* Heading */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 fade-up"
              style={{ color: "var(--text-primary)", animationDelay: "0.05s" }}
            >
              {t("Luyện nghe", "Practice")}{" "}
              <span className="gradient-text">VSTEP</span>
              <br />
              <span style={{ color: "var(--text-secondary)" }} className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                {t("chuẩn B1–B2", "Standard B1–B2")}
              </span>
            </h1>

            <p
              className="text-lg leading-relaxed mb-10 max-w-xl fade-up"
              style={{ color: "var(--text-secondary)", animationDelay: "0.1s" }}
            >
              {t(
                "Bộ đề thi nghe chất lượng cao, định dạng chuẩn VSTEP. Luyện tập, xem đáp án và theo dõi tiến bộ của bạn.",
                "High-quality listening tests in standard VSTEP format. Practice, review answers, and track your progress."
              )}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 fade-up" style={{ animationDelay: "0.15s" }}>
              {[
                { value: "3", label: t("Parts / đề", "Parts / test"), icon: "◈" },
                { value: "35", label: t("Câu hỏi", "Questions"), icon: "◎" },
                { value: "35'", label: t("Thời gian", "Duration"), icon: "◷" },
                { value: "B1–B2", label: t("Trình độ", "Level"), icon: "◆" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "#a78bfa" }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div
        className="h-px max-w-7xl mx-auto"
        style={{ background: "linear-gradient(to right, transparent, var(--border-default), transparent)" }}
      />

      {/* ── Exam list ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Section title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{t("Danh sách đề thi", "Exam List")}</h2>
            {!loading && exams.length > 0 && (
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {exams.length} {t("đề thi có sẵn", "exams available")}
              </p>
            )}
          </div>
          {!loading && exams.length > 0 && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t("Cập nhật mới nhất", "Latest")}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-8 flex items-start gap-3 p-4 rounded-2xl text-sm"
            style={{
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.2)",
              color: "#fb7185",
            }}
          >
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl skeleton" />
                  <div className="w-16 h-5 rounded-full skeleton" />
                </div>
                <div className="h-5 rounded-lg skeleton w-3/4 mb-2" />
                <div className="h-4 rounded-lg skeleton w-full mb-1.5" />
                <div className="h-4 rounded-lg skeleton w-2/3 mb-6" />
                <div className="flex gap-3 mb-5">
                  <div className="h-4 rounded skeleton w-20" />
                  <div className="h-4 rounded skeleton w-16" />
                </div>
                <div className="h-10 rounded-xl skeleton" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && exams.length === 0 && (
          <div
            className="text-center py-24 rounded-2xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px dashed var(--border-default)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              🎧
            </div>
            <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{t("Chưa có đề thi nào", "No exams yet")}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("Quay lại sau để xem đề thi mới nhất", "Check back later for new exams")}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && exams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam, i) => (
              <ExamCard key={exam.id} exam={exam} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      {!loading && exams.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div
            className="rounded-3xl p-8 sm:p-10 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 100%)",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(6,182,212,0.12)" }}
            />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  {t("Theo dõi tiến độ của bạn", "Track your progress")}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {t("Tạo tài khoản miễn phí để lưu kết quả và xem lịch sử làm bài", "Create a free account to save results and view your history")}
                </p>
              </div>
              <Link
                href="/register"
                className="shrink-0 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.03] hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                {t("Đăng ký miễn phí →", "Sign up free →")}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ExamCard({ exam, index }: { exam: Exam; index: number }) {
  const { t } = useLang();
  const lc = LEVEL_CONFIG[exam.level ?? ""] ?? DEFAULT_LEVEL;

  return (
    <Link
      href={`/test/${exam.id}`}
      className="group block h-full fade-up"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div
        className="h-full rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 0 0 0 rgba(124,58,237,0)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(124,58,237,0.3)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,58,237,0.15)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.border = "1px solid var(--border-subtle)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(124,58,237,0)";
        }}
      >
        {/* Gradient accent bar */}
        <div
          className={`h-1 bg-gradient-to-r ${lc.gradient} opacity-70 group-hover:opacity-100 transition-opacity`}
        />

        <div className="p-6 flex flex-col h-[calc(100%-4px)]">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: lc.bg }}
            >
              <svg className="w-5 h-5" style={{ color: lc.text }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z"/>
              </svg>
            </div>
            {exam.level && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: lc.bg, color: lc.text }}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${lc.gradient}`} />
                {exam.level}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-bold text-base leading-snug mb-2 transition-colors duration-200 group-hover:text-violet-400"
            style={{ color: "var(--text-primary)" }}
          >
            {exam.title}
          </h3>

          {/* Description */}
          {exam.description && (
            <p className="text-sm line-clamp-2 mb-4 flex-1" style={{ color: "var(--text-muted)" }}>
              {exam.description}
            </p>
          )}

          <div className="mt-auto">
            {/* Stats */}
            <div
              className="flex items-center gap-4 text-xs py-3 mb-4"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                  value: `${exam.total_questions ?? 35} ${t("câu", "questions")}`,
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                  value: `${exam.total_duration ?? 35} ${t("phút", "min")}`,
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
                  value: "3 parts",
                },
              ].map((s) => (
                <span key={s.value} className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {s.icon}
                  </svg>
                  {s.value}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 group-hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
            >
              {t("Làm bài ngay →", "Start now →")}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
