"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { useAuth } from "@/lib/auth-context";

interface Exam {
  id: number;
  title: string;
  description?: string;
  level?: string;
  total_duration?: number;
  total_questions?: number;
}

const LEVEL_CONFIG: Record<string, { gradient: string; text: string; bg: string; border: string }> = {
  "B1":    { gradient: "135deg, #10b981, #14b8a6", text: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)" },
  "B2":    { gradient: "135deg, #06b6d4, #3b82f6", text: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)" },
  "B1-B2": { gradient: "135deg, #8b5cf6, #06b6d4", text: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  "C1":    { gradient: "135deg, #a855f7, #ec4899", text: "#a855f7", bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.2)" },
  "C2":    { gradient: "135deg, #f43f5e, #f97316", text: "#f43f5e", bg: "rgba(244,63,94,0.08)",   border: "rgba(244,63,94,0.2)" },
};

const DEFAULT_LEVEL = { gradient: "135deg, #64748b, #94a3b8", text: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" };

export default function Home() {
  const { t } = useLang();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 65%)"
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="flex flex-col items-center text-center">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#a78bfa",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              {t("Nền tảng luyện thi VSTEP hàng đầu", "Vietnam's VSTEP Listening Practice Platform")}
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 max-w-4xl">
              <span style={{ color: "var(--text-primary)" }}>{t("Chinh phục", "Master")}{" "}</span>
              <span style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #10b981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {t("Listening VSTEP", "VSTEP Listening")}
              </span>
              <br />
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ color: "var(--text-secondary)" }}>
                {t("chuẩn B1 · B2 · C1", "Standard B1 · B2 · C1")}
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              {t(
                "Bộ đề nghe chuẩn format VSTEP, đầy đủ audio và đáp án chi tiết. Làm bài, xem lại và theo dõi tiến bộ mỗi ngày.",
                "Full-format VSTEP listening tests with audio, detailed answers, and progress tracking — all in one place."
              )}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-14">
              <a
                href="#exams"
                className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                {t("Xem đề thi →", "Browse exams →")}
              </a>
              {!user && (
                <Link
                  href="/register"
                  className="px-7 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:opacity-80 hover:-translate-y-0.5"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  {t("Đăng ký miễn phí", "Sign up free")}
                </Link>
              )}
            </div>

            {/* Stats bar */}
            <div
              className="grid grid-cols-4 rounded-2xl overflow-hidden"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              {[
                { value: "3", label: t("Parts / đề", "Parts / test"), color: "#7c3aed" },
                { value: "35", label: t("Câu hỏi", "Questions"), color: "#06b6d4" },
                { value: "35'", label: t("Thời gian", "Duration"), color: "#10b981" },
                { value: "B1–C1", label: t("Cấp độ", "Levels"), color: "#a855f7" },
              ].map((stat, i, arr) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center px-5 py-4 gap-0.5"
                  style={{
                    borderRight: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <p className="text-lg font-black leading-none tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[11px] mt-1 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
              {
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0 1 18 0v6"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
                text: t("Audio chất lượng cao", "High-quality audio"),
              },
              {
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
                text: t("Đáp án chi tiết", "Detailed answers"),
              },
              {
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
                text: t("Theo dõi tiến độ", "Progress tracking"),
              },
              {
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
                text: t("Làm lại không giới hạn", "Unlimited retakes"),
              },
              {
                icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>,
                text: t("Giao diện tối / sáng", "Dark / light mode"),
              },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "#7c3aed", opacity: 0.8 }}>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Exam list ── */}
      <section id="exams" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7c3aed" }}>
              {t("Kho đề thi", "Exam library")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              {t("Danh sách đề thi", "Available Exams")}
            </h2>
          </div>
          {!loading && exams.length > 0 && (
            <span
              className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              {exams.length} {t("đề có sẵn", "available")}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-8 flex items-start gap-3 p-4 rounded-2xl text-sm"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}
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
              <div key={i} className="rounded-3xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl skeleton" />
                  <div className="w-14 h-5 rounded-full skeleton" />
                </div>
                <div className="h-5 rounded-lg skeleton w-3/4 mb-3" />
                <div className="h-4 rounded-lg skeleton w-full mb-2" />
                <div className="h-4 rounded-lg skeleton w-2/3 mb-7" />
                <div className="h-11 rounded-2xl skeleton" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && exams.length === 0 && (
          <div
            className="text-center py-24 rounded-3xl"
            style={{ background: "var(--bg-surface)", border: "1px dashed var(--border-default)" }}
          >
            <div className="text-4xl mb-4">🎧</div>
            <p className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("Chưa có đề thi nào", "No exams yet")}</p>
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

      {/* ── How it works ── */}
      {!loading && exams.length > 0 && (
        <section style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">

            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06b6d4" }}>
                {t("Cách hoạt động", "How it works")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                {t("Làm bài chỉ trong 3 bước", "Get started in 3 steps")}
              </h2>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  ),
                  title: t("Chọn đề thi", "Pick an exam"),
                  desc: t("Duyệt qua các đề thi, chọn cấp độ phù hợp với bạn — B1, B2 hoặc C1.", "Browse the exam library and pick the level that suits you — B1, B2, or C1."),
                  color: "#7c3aed",
                  bg: "rgba(124,58,237,0.08)",
                  border: "rgba(124,58,237,0.15)",
                  glow: "rgba(124,58,237,0.2)",
                },
                {
                  step: 2,
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0 1 18 0v6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                  ),
                  title: t("Nghe và trả lời", "Listen & answer"),
                  desc: t("Nghe audio theo từng Part, chọn đáp án trong thời gian cho phép. Bài làm được lưu tự động.", "Listen part by part, select your answers within the time limit. Progress is saved automatically."),
                  color: "#06b6d4",
                  bg: "rgba(6,182,212,0.08)",
                  border: "rgba(6,182,212,0.15)",
                  glow: "rgba(6,182,212,0.2)",
                },
                {
                  step: 3,
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                    </svg>
                  ),
                  title: t("Xem kết quả & Xem lại", "Review & improve"),
                  desc: t("Xem điểm theo từng Part, đáp án đúng và lưu lịch sử làm bài để theo dõi tiến bộ.", "See per-part scores, correct answers, and keep a full history to track your improvement."),
                  color: "#10b981",
                  bg: "rgba(16,185,129,0.08)",
                  border: "rgba(16,185,129,0.15)",
                  glow: "rgba(16,185,129,0.2)",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="relative flex flex-col gap-4 p-6 rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${s.color}, transparent)` }} />

                  {/* Icon + step label */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, boxShadow: `0 0 16px ${s.glow}` }}
                    >
                      {s.icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: s.color }}>
                      {t(`Bước ${s.step}`, `Step ${s.step}`)}
                    </span>
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="font-bold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      {!user && !loading && exams.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div
            className="rounded-3xl px-8 sm:px-14 py-12 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.1) 100%)",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)" }} />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1), transparent 70%)" }} />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
              <div>
                <h3 className="text-2xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
                  {t("Sẵn sàng chinh phục VSTEP?", "Ready to ace VSTEP?")}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {t(
                    "Tạo tài khoản miễn phí để lưu kết quả, xem lại bài làm và theo dõi tiến bộ.",
                    "Create a free account to save results, review answers, and track your progress."
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/register"
                  className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
                >
                  {t("Đăng ký miễn phí →", "Sign up free →")}
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:opacity-80 hover:-translate-y-0.5 whitespace-nowrap"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                >
                  {t("Đăng nhập", "Log in")}
                </Link>
              </div>
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
        className="h-full rounded-3xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl flex flex-col"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.border = `1px solid ${lc.border}`;
          (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 50px rgba(0,0,0,0.35)`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.border = "1px solid var(--border-subtle)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        {/* Top accent */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(${lc.gradient})`, opacity: 0.8 }} />

        <div className="p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: lc.bg, border: `1px solid ${lc.border}` }}
            >
              <svg className="w-6 h-6" style={{ color: lc.text }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z" />
              </svg>
            </div>
            {exam.level && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: lc.bg, color: lc.text, border: `1px solid ${lc.border}` }}
              >
                {exam.level}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-black text-base leading-snug mb-2.5 transition-colors duration-200"
            style={{ color: "var(--text-primary)" }}
          >
            {exam.title}
          </h3>

          {/* Description */}
          {exam.description && (
            <p className="text-sm line-clamp-2 mb-5 flex-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {exam.description}
            </p>
          )}

          <div className="mt-auto">
            {/* Stats chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { label: `${exam.total_questions ?? 35} ${t("câu", "qs")}`, icon: "📝" },
                { label: `${exam.total_duration ?? 35} ${t("phút", "min")}`, icon: "⏱" },
                { label: "3 parts", icon: "◈" },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-medium"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
                >
                  {s.icon} {s.label}
                </span>
              ))}
            </div>

            {/* CTA button */}
            <div
              className="w-full py-3 rounded-2xl text-sm font-bold text-center text-white transition-all duration-200 group-hover:opacity-90 group-hover:shadow-lg"
              style={{ background: `linear-gradient(${lc.gradient})` }}
            >
              {t("Làm bài ngay →", "Start now →")}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
