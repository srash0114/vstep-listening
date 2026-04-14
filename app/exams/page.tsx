"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

const LEVEL_CONFIG: Record<string, { gradient: string; text: string; bg: string; border: string }> = {
  "B1": { gradient: "135deg, #10b981, #14b8a6", text: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  "B2": { gradient: "135deg, #06b6d4, #3b82f6", text: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
  "B1-B2": { gradient: "135deg, #8b5cf6, #06b6d4", text: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  "C1": { gradient: "135deg, #a855f7, #ec4899", text: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)" },
  "C2": { gradient: "135deg, #f43f5e, #f97316", text: "#f43f5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)" },
};
const DEFAULT_LEVEL = { gradient: "135deg, #64748b, #94a3b8", text: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" };

const PAGE_SIZE = 12;

export default function ExamsPage() {
  const { t } = useLang();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevel] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    testsApi.getAll()
      .then(res => {
        if (res.success) {
          const raw = res.data as any;
          const arr: Exam[] = Array.isArray(raw)
            ? raw
            : raw?.exams ?? raw?.data ?? [];
          arr.sort((a, b) => a.id - b.id);
          setExams(arr);
        } else {
          setExams([]);
        }
      })
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  // Derive unique levels
  const levels = useMemo(() => {
    const s = new Set(exams.map(e => e.level).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [exams]);

  // Filter + search
  const filtered = useMemo(() => exams.filter(e => {
    const matchLevel = levelFilter === "all" || e.level === levelFilter;
    const matchSearch = search.trim() === "" || e.title.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  }), [exams, search, levelFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleLevel = (v: string) => { setLevel(v); setPage(1); };

  return (
    <div className="min-h-screen p-4" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link href="/" className="text-sm flex items-center gap-2 w-fit hover:opacity-80 transition-opacity" style={{ color: "var(--text-muted)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("Trang chủ", "Home")}
            </Link>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent-violet)" }}>
            {t("Kho đề thi", "Exam library")}
          </p>
          <h1 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: "var(--text-primary)" }}>
            {t("Thư viện luyện tập", "Practice Library")}
          </h1>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            {t(
              "Tổng hợp toàn bộ kho đề thi VSTEP. Lọc theo cấp độ, tìm kiếm và bắt đầu luyện tập ngay.",
              "Browse all VSTEP practice exams. Filter by level, search, and start practicing now."
            )}
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder={t("Tìm kiếm đề thi...", "Search exams...")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
              style={{ background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            />
          </div>

          {/* Level filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {["all", ...levels].map(lvl => (
              <button
                key={lvl}
                onClick={() => handleLevel(lvl)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200"
                style={
                  levelFilter === lvl
                    ? { background: "var(--accent-violet)", color: "#fff", border: "1px solid var(--accent-violet)" }
                    : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }
                }
              >
                {lvl === "all" ? t("Tất cả", "All") : lvl}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats bar */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
            <span>
              {t(
                `Hiển thị ${paginated.length} / ${filtered.length} đề thi`,
                `Showing ${paginated.length} of ${filtered.length} exams`
              )}
            </span>
            {filtered.length !== exams.length && (
              <button
                onClick={() => { handleSearch(""); handleLevel("all"); }}
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--accent-violet)" }}
              >
                {t("Xóa bộ lọc", "Clear filters")}
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-violet)" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 rounded-[2rem]" style={{ background: "var(--bg-glass)", border: "1px dashed var(--border-default)" }}>
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
              {t("Không tìm thấy đề thi", "No exams found")}
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              {t("Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm", "Try changing your filters or search term")}
            </p>
            <button
              onClick={() => { handleSearch(""); handleLevel("all"); }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "var(--accent-violet)" }}
            >
              {t("Xem tất cả đề", "Show all exams")}
            </button>
          </div>
        )}

        {/* Exam Grid */}
        {!loading && paginated.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {paginated.map(exam => (
              <motion.div
                key={exam.id}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}
              >
                <ExamCard exam={exam} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
            >
              ← {t("Trước", "Prev")}
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-9 h-9 rounded-xl text-sm font-bold transition-all"
                  style={
                    p === page
                      ? { background: "var(--accent-violet)", color: "#fff" }
                      : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }
                  }
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
            >
              {t("Sau", "Next")} →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── ExamCard ──────────────────────────────────────────────────────────────────
function ExamCard({ exam }: { exam: Exam }) {
  const { t } = useLang();
  const lc = LEVEL_CONFIG[exam.level ?? ""] ?? DEFAULT_LEVEL;

  return (
    <Link href={`/exam/${exam.id}`} className="group block h-full">
      <div
        className="h-full min-h-[380px] rounded-[1.75rem] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
        style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", backdropFilter: "blur(12px)" }}
      >
        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[1.75rem]"
          style={{ background: `radial-gradient(circle at 50% 0%, ${lc.border}, transparent 70%)` }}
        />

        {/* Thumbnail */}
        <div className="w-full h-36 shrink-0 relative overflow-hidden" style={{ borderBottom: "1px solid var(--border-glass)" }}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)]" />

          {exam.level && (
            <div className="absolute bottom-3 left-4">
              <span
                className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md"
                style={{ color: lc.text, background: "rgba(0,0,0,0.4)", border: `1px solid ${lc.border}` }}
              >
                {exam.level}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 relative z-10">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            style={{ background: lc.bg, border: `1px solid ${lc.border}` }}
          >
            <svg className="w-5 h-5" style={{ color: lc.text }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z" />
            </svg>
          </div>

          {/* Title */}
          <h3
            className="font-extrabold text-base leading-snug mb-2 transition-all group-hover:text-transparent bg-clip-text line-clamp-2"
            style={{ color: "var(--text-on-glass)", backgroundImage: `linear-gradient(${lc.gradient})` }}
          >
            {exam.title}
          </h3>

          {exam.description && (
            <p className="text-xs line-clamp-2 mb-4 flex-1" style={{ color: "var(--text-on-glass-muted)" }}>
              {exam.description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-auto space-y-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: "📝", label: `${exam.total_questions ?? 35} ${t("câu", "qs")}` },
                { icon: "⏱", label: `${exam.total_duration ?? 35} ${t("phút", "min")}` },
                { icon: "💎", label: "3 parts" },
              ].map(s => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-bold"
                  style={{ background: "var(--bg-overlay)", color: "var(--text-on-glass-muted)", border: "1px solid var(--border-glass)" }}
                >
                  <span className="opacity-70">{s.icon}</span> {s.label}
                </span>
              ))}
            </div>

            <div
              className="w-full py-3 rounded-xl text-xs font-black text-center text-white opacity-90 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(${lc.gradient})` }}
            >
              {t("XEM CHI TIẾT →", "VIEW DETAILS →")}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
