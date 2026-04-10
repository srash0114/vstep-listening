"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
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
  "B1": { gradient: "135deg, #10b981, #14b8a6", text: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  "B2": { gradient: "135deg, #06b6d4, #3b82f6", text: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
  "B1-B2": { gradient: "135deg, #8b5cf6, #06b6d4", text: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  "C1": { gradient: "135deg, #a855f7, #ec4899", text: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)" },
  "C2": { gradient: "135deg, #f43f5e, #f97316", text: "#f43f5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)" },
};

const DEFAULT_LEVEL = { gradient: "135deg, #64748b, #94a3b8", text: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" };

// --- Animations configuration ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 80 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const zoomIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home() {
  const { t } = useLang();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolldown, setIsScrolldown] = useState(false);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolldown(window.scrollY > 280);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Custom wheel to horizontal scroll mapping
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Natural horizontal scrolling (trackpads) passes through
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const isAtLeft = el.scrollLeft <= 0 && e.deltaY < 0;
      const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;

      // Let it scroll the page naturally if we hit the edges
      if (isAtLeft || isAtRight) return;

      e.preventDefault();
      // Remove snap behavior temporarily so it feels smooth when wheeling
      el.style.scrollSnapType = 'none';
      el.scrollLeft += e.deltaY;

      // Restore snap afterwards
      if ((el as any)._snapTimeout) clearTimeout((el as any)._snapTimeout);
      (el as any)._snapTimeout = setTimeout(() => {
        el.style.scrollSnapType = '';
      }, 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [exams]);

  // Auto scroll every 5s
  useEffect(() => {
    if (isHovered || exams.length === 0) return;
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          sliderRef.current.scrollBy({ left: 360, behavior: "smooth" });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, exams]);

  // Enable native scroll snapping on the document element for this landing page
  useEffect(() => {
    document.documentElement.classList.add("snap-y", "snap-mandatory", "scroll-smooth");
    return () => {
      document.documentElement.classList.remove("snap-y", "snap-mandatory", "scroll-smooth");
    };
  }, []);

  useEffect(() => {
    testsApi
      .getAll()
      .then((res) => {
        if (res.success) {
          const raw = res.data as any;
          let examsArr = Array.isArray(raw) ? raw : raw?.exams || raw?.data || [];
          examsArr.sort((a: Exam, b: Exam) => a.id - b.id);
          setExams(examsArr);
        } else {
          setError(res.message || t("Không tải được danh sách đề thi", "Failed to load exams"));
        }
      })
      .catch((err: any) => setError(err?.message || t("Không tải được danh sách đề thi", "Failed to load exams")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="w-full flex flex-col" style={{ background: "var(--bg-base)" }}>
      <style>{`
        html, body { overflow-x: hidden }
        footer { scroll-snap-align: end; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.5); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(124, 58, 237, 0.8); }
        .glass-panel { background: rgba(20, 20, 30, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Section 1: Hero ── */}
      <section className="scroll-mt-16 snap-start lg:snap-always w-full flex flex-col relative text-center lg:text-left z-10 lg:pt-0 lg:pb-0 overflow-hidden overflow-y-visible lg:overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 65%)" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full px-4 sm:px-8 py-10">
          <motion.div
            className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
          >
            {/* Left side: Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1 mt-8 lg:mt-0">
              <motion.div variants={slideUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                {t("Nền tảng luyện thi VSTEP hàng đầu", "Vietnam's VSTEP Listening Platform")}
              </motion.div>

              <motion.h1 variants={slideUp} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-6">
                <span style={{ color: "var(--text-primary)" }}>{t("Chinh phục", "Master")}{" "}</span>
                <span style={{ background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #10b981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {t("Listening VSTEP", "VSTEP Listening")}
                </span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ color: "var(--text-secondary)" }}>
                  {t("chuẩn B1 · B2 · C1", "Standard B1 · B2 · C1")}
                </span>
              </motion.h1>

              <motion.p variants={slideUp} className="text-base sm:text-lg leading-relaxed mb-10 max-w-lg lg:max-w-none" style={{ color: "var(--text-secondary)" }}>
                {t(
                  "Luyện nghe thực chiến chân thực, cung cấp trải nghiệm làm bài sát với thực tế, phản hồi kết quả và giải thích chuyên sâu ngay lập tức.",
                  "Gain real test experience with immersive UI, immediate per-part scoring, and deep analytic feedback."
                )}
              </motion.p>

              <motion.div variants={slideUp} className="flex flex-wrap gap-4 items-center justify-center lg:justify-start w-full mb-12">
                <a href="#exams" className="px-8 py-4 rounded-2xl text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(124,58,237,0.3)]" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                  {t("Bắt đầu luyện tập →", "Start Practicing →")}
                </a>
                {!user && (
                  <Link href="/register" className="px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300 hover:bg-white/5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                    {t("Đăng ký miễn phí", "Sign up free")}
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Right side: Awesome 3D Image */}
            <motion.div variants={zoomIn} className="relative w-full aspect-square max-w-[380px] sm:max-w-[400px] lg:max-w-none lg:w-full lg:h-[400px] xl:h-[500px] mx-auto order-1 lg:order-2 perspective-1000">
              {/* Glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tr from-[#7c3aed]/40 to-[#06b6d4]/40 blur-3xl rounded-full" />

              {/* Main image container */}
              <div className="relative w-full h-full rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden glass-panel group transition-transform duration-500 hover:rotate-2">
                <Image src="/hero_student_3d.png" alt="Student learning VSTEP" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" priority />
              </div>

              {/* Floating Badges */}
              <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -top-8 sm:-top-8 -right-2 sm:-right-10 p-3 sm:p-5 rounded-3xl glass-panel z-20 flex items-center gap-3">
                <div className="text-2xl sm:text-3xl">🎯</div>
                <div>
                  <p className="text-white font-black text-sm sm:text-base tracking-tight">VSTEP 8.5+</p>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Mục tiêu đỗ</p>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute -bottom-6 sm:-bottom-10 -left-2 sm:-left-10 p-3 sm:p-5 rounded-3xl glass-panel z-20 flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-white font-black text-sm sm:text-base tracking-tight">Chấm điểm ngay</p>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">AI tự động feedback</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature Strip attached to bottom */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.8, delay: 0.4 }} className="max-w-7xl mx-auto w-full mt-auto py-5 px-5 rounded-full border-t border-b border-white/5 bg-white/[0.02] backdrop-blur-md hidden sm:block">
          <div className="px-4 flex justify-between gap-4 overflow-x-clip">
            {[
              { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0 1 18 0v6" />, text: t("Audio chất lượng studio", "Studio-quality audio") },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />, text: t("Giải chi tiết", "Detailed solutions") },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6...m-6 0..." />, text: t("Dashboard điểm số", "Score dashboard") },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />, text: t("Dark/Light Mode", "Dark/Light Mode") },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-400">
                <span className="text-violet-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{f.icon}</svg></span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Section 2: Exam list ── */}
      <section id="exams" className="scroll-mt-16 snap-start snap-always w-full flex flex-col justify-center px-4 py-0 sm:py-10">
        <motion.div
          className="max-w-7xl mx-auto w-full"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
        >
          {/* Section header */}
          <motion.div variants={slideLeft} className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7c3aed" }}>
                {t("Kho đề thi", "Exam library")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
                {t("Thư viện luyện tập", "Practice Library")}
              </h2>
            </div>
            {!loading && exams.length > 0 && (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                {/* {exams.length > 6 && (
                  <Link href="/exams" className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                    {t("Xem tất cả", "See all")} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )} */}
                <span className="text-xs px-4 py-2 rounded-xl font-bold uppercase tracking-wider hidden sm:block" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                  {exams.length} {t("đề thi mới", "new exams")}
                </span>
              </div>
            )}
          </motion.div>

          {error && (
            <motion.div variants={zoomIn} className="mb-8 flex items-start gap-3 p-5 rounded-2xl text-sm" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}>
              <span className="text-xl">⚠️</span> {error}
            </motion.div>
          )}

          {loading && (
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <motion.div variants={slideUp} key={i} className="rounded-3xl p-6 h-64 skeleton opacity-50" style={{ background: "var(--bg-surface)" }} />
              ))}
            </motion.div>
          )}

          {!loading && !error && exams.length === 0 && (
            <motion.div variants={zoomIn} className="text-center py-32 rounded-[2.5rem] glass-panel border-dashed border-slate-700">
              <div className="text-6xl mb-6 opacity-80">🎧</div>
              <p className="text-xl font-black mb-2">{t("Kho đề đang được cập nhật", "Library is updating")}</p>
              <p className="text-slate-400">{t("Quay lại sau nhé!", "Check back later!")}</p>
            </motion.div>
          )}

          {!loading && exams.length > 0 && (
            <div
              className="relative w-full group/slider"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => setIsHovered(false)}
            >
              {/* Left Arrow Button */}
              <button
                onClick={scrollLeft}
                className="hidden sm:flex absolute left-2 lg:-left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass-panel items-center justify-center text-white opacity-0 group-hover/slider:opacity-100 transition-all hover:scale-110 hover:bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10"
                aria-label="Scroll left"
              >
                <svg className="w-6 h-6 pr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>

              <motion.div
                ref={sliderRef}
                variants={slideUp}
                className="flex overflow-x-auto snap-x snap-mandatory gap-6 lg:gap-8 pb-8 pt-4 hide-scrollbar"
              >
                {exams.map((exam) => (
                  <div key={exam.id} className="min-w-[280px] sm:min-w-[340px] md:min-w-[380px] snap-center shrink-0">
                    <ExamCard exam={exam} />
                  </div>
                ))}

                {/* Dummy item for right padding in scroll view */}
                <div className="min-w-[1px] shrink-0" />
              </motion.div>

              {/* Right Arrow Button */}
              <button
                onClick={scrollRight}
                className="hidden sm:flex absolute right-2 lg:-right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass-panel items-center justify-center text-white opacity-0 group-hover/slider:opacity-100 transition-all hover:scale-110 hover:bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10"
                aria-label="Scroll right"
              >
                <svg className="w-6 h-6 pl-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>

              {/* Fade gradients for indicator */}
              <div className="absolute top-0 bottom-8 left-0 w-4 sm:w-8 bg-gradient-to-r from-[var(--bg-base)] to-transparent pointer-events-none" />
              <div className="absolute top-0 bottom-8 right-0 w-4 sm:w-8 bg-gradient-to-l from-[var(--bg-base)] to-transparent pointer-events-none" />
            </div>
          )}
        </motion.div>
      </section>

      {/* ── Section 3: How it works (Image + Text split) ── */}
      {!loading && exams.length > 0 && (
        <section className="scroll-mt-16 snap-start lg:snap-always w-full flex flex-col justify-center px-4 pb-10 bg-[var(--bg-base)]">
          <motion.div
            className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-16 items-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
          >
            {/* Left UI Mockup Image */}
            <motion.div variants={slideRight} className="relative w-full order-2 lg:order-1 flex justify-center py-2 lg:py-8 mt-4 lg:mt-0">
              {/* Decorative backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-cyan-400/20 rounded-[2rem] lg:rounded-[3rem] transform -rotate-3 scale-100 sm:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 to-violet-600/20 rounded-[2rem] lg:rounded-[3rem] transform rotate-2 blur-xl opacity-50" />
              {/* Floating Mockup Card */}
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -top-3 -right-0 sm:top-auto sm:-bottom-8 sm:-right-4 lg:-right-8 glass-panel p-3 sm:p-5 rounded-[1rem] sm:rounded-2xl border border-white/10 shadow-2xl z-20 w-[85%] max-w-[200px] sm:max-w-none sm:w-64 backdrop-blur-md"
                style={{ background: "rgba(20, 20, 30, 0.85)" }}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-white text-[11px] sm:text-sm font-bold tracking-wide">Listening Part 1</p>
                    <p className="text-emerald-400 text-[10px] sm:text-xs font-bold mt-0.5">8/8 Correct</p>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1 sm:h-1.5 mt-1.5 sm:mt-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ duration: 1, delay: 0.5 }} className="bg-emerald-400 h-full rounded-full" />
                </div>
              </motion.div>
              <div className="relative w-full max-w-[280px] sm:max-w-[400px] lg:max-w-[500px]">
                <div className="relative w-full aspect-[4/3] rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden glass-panel group shadow-[0_10px_30px_rgba(0,0,0,0.5)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col bg-[#0b0f19]">
                  {/* Mac OS window header */}
                  <div className="h-8 sm:h-10 w-full bg-white/5 flex items-center px-4 sm:px-5 gap-1.5 sm:gap-2 border-b border-white/5 shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
                  </div>

                  {/* Image content */}
                  <div className="relative flex-1 w-full bg-black">
                    <Image src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop" alt="Dashboard Mockup" fill className="object-cover object-center opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/20 to-transparent" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Text / Vertical steps */}
            <div className="order-1 lg:order-2 flex flex-col items-center lg:items-start text-center lg:text-left">
              <motion.div variants={slideLeft} className="mb-6 w-full">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400 inline-block">
                  {t("Cách thức hoạt động", "Workflow")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {t("Làm bài thông minh, tối ưu điểm số", "Practice smart, maximize score")}
                </h2>
                <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Trải nghiệm phòng thi ngay tại nhà với các công cụ chấm chữa bằng thuật toán tiên tiến. Điểm chuẩn hơn, cải thiện nhanh hơn.
                </p>
              </motion.div>

              <div className="relative flex flex-col gap-3 sm:gap-4 w-full max-w-lg mx-auto lg:mx-0">
                {[
                  { step: 1, color: "#7c3aed", title: t("Chọn đề & Mức độ", "Select level"), desc: "Kho dữ liệu B1, B2, C1 phong phú đa dạng chủ đề." },
                  { step: 2, color: "#06b6d4", title: t("Thi thử như thật", "Simulated testing"), desc: "Giới hạn thời gian, chia part khoa học, giao diện làm bài tập trung cao độ." },
                  { step: 3, color: "#10b981", title: t("Chấm chữa & Theo dõi", "Analyze & Track"), desc: "So sánh đáp án, nghe giải thích, đồ thị tăng trưởng minh bạch." },
                ].map((s, idx, arr) => (
                  <motion.div variants={slideUp} key={s.step} className="relative flex gap-3 sm:gap-4 text-left group items-start">
                    {/* Connecting line to the next item */}
                    {idx < arr.length - 1 && (
                      <div
                        className="absolute left-[19px] top-[20px] w-[2px] hidden sm:block h-[calc(100%+12px)] sm:h-[calc(100%+16px)] pointer-events-none"
                        style={{ background: `linear-gradient(to bottom, ${s.color}40, ${arr[idx + 1].color}40)` }}
                      />
                    )}
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black text-base shrink-0 shadow-lg relative z-10 transition-transform duration-300 group-hover:scale-[1.10] group-hover:-rotate-3 bg-[var(--bg-base)]" style={{ color: s.color, border: `1px solid ${s.color}`, boxShadow: `0 0 10px ${s.color}20` }}>
                      {s.step}
                    </div>
                    <div className="bg-white/[0.02] p-3 sm:p-4 rounded-2xl border border-white/5 flex-1 transition-all duration-300 group-hover:bg-white/[0.05] group-hover:border-white/10 shadow-sm group-hover:shadow-md">
                      <h4 className="font-bold text-sm sm:text-base mb-1" style={{ color: "var(--text-primary)" }}>{s.title}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ── Section 4: CTA Banner ── */}
      {!user && !loading && exams.length > 0 && (
        <section className="scroll-mt-16 snap-start lg:snap-always w-full min-h-[50vh] lg:min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 pb-10">
          <motion.div
            className="max-w-5xl mx-auto w-full"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
          >
            <motion.div variants={zoomIn} className="rounded-[3rem] px-8 sm:px-16 py-16 relative overflow-hidden glass-panel"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.15) 100%)", borderColor: "rgba(124,58,237,0.3)" }}>
              {/* Decorative circles */}
              <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
                <span className="text-5xl mb-4">🚀</span>
                <h3 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight text-white drop-shadow-md">
                  Bắt kịp trình độ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">của bạn</span> ngay hôm nay
                </h3>
                <p className="text-base sm:text-lg text-slate-300 mb-10">
                  {t(
                    "Gia nhập nền tảng với hơn hàng ngàn bộ câu hỏi, tính năng lưu trữ kết quả và lộ trình học tập tuỳ biến.",
                    "Join our platform to get unlimited tests, saved history, and custom study plans."
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                  <Link href="/register" className="px-10 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(124,58,237,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                    {t("Tạo tài khoản miễn phí", "Create Free Account")}
                  </Link>
                  <Link href="/login" className="px-10 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 hover:bg-white/10 glass-panel">
                    {t("Đăng nhập ngay", "Sign in")}
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* Btn to scroll back to top */}
      {isScrolldown && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 group"
        >
          {/* Animated glow ring behind the button */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 opacity-0 group-hover:opacity-75 blur-lg transition-all duration-500 group-hover:animate-pulse" />
          
          <motion.button
            whileHover={{ y: -4, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="relative flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/20 focus:outline-none overflow-hidden"
            aria-label="Scroll to top"
          >
            {/* Default background (dark glass) */}
            <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-xl transition-opacity duration-500 group-hover:opacity-0" />
            
            {/* Hover background (vibrant gradient) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7c3aed] via-[#d946ef] to-[#06b6d4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Inner highlight for 3D effect */}
            <div className="absolute inset-0 rounded-full border-[1.5px] border-white/10 group-hover:border-white/30 transition-colors duration-300" />
            
            {/* Icon Container */}
            <div className="relative z-10 flex flex-col items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

function ExamCard({ exam }: { exam: Exam }) {
  const { t } = useLang();
  const lc = LEVEL_CONFIG[exam.level ?? ""] ?? DEFAULT_LEVEL;

  return (
    <Link href={`/test/${exam.id}`} className="group block h-full w-full">
      <div
        className="h-full min-h-[440px] rounded-[2rem] overflow-hidden transition-all duration-400 hover:-translate-y-2 flex flex-col relative glass-panel group-hover:bg-white/[0.04]"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${lc.gradient.split(',')[1]}33, transparent 70%)` }} />

        {/* Course Placeholder Image */}
        <div className="w-full h-44 shrink-0 relative overflow-hidden bg-white/5 border-b border-white/5">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms]" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop')`, opacity: 0.8 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,20,30,1)] to-transparent" />

          <div className="absolute bottom-4 left-6 flex items-center gap-2">
            {exam.level && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl shadow-sm" style={{ color: lc.text, border: `1px solid ${lc.border}` }}>
                {exam.level}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1 z-10">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-[1.15] group-hover:rotate-6" style={{ background: lc.bg, border: `1px solid ${lc.border}` }}>
              <svg className="w-6 h-6" style={{ color: lc.text }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z" />
              </svg>
            </div>
          </div>
          <h3
            className="font-extrabold text-xl leading-snug mb-3 transition-all text-white group-hover:text-transparent bg-clip-text"
            style={{ backgroundImage: `linear-gradient(${lc.gradient})` }}
          >
            {exam.title}
          </h3>
          {exam.description && (
            <p className="text-sm line-clamp-2 mb-6 flex-1 text-slate-400 group-hover:text-slate-300 transition-colors">
              {exam.description}
            </p>
          )}

          <div className="mt-auto">
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: `${exam.total_questions ?? 35} ${t("câu", "qs")}`, icon: "📝" },
                { label: `${exam.total_duration ?? 35} ${t("phút", "min")}`, icon: "⏱" },
                { label: "3 parts", icon: "💎" },
              ].map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold bg-black/20 text-slate-300 border border-white/5">
                  <span className="opacity-70">{s.icon}</span> {s.label}
                </span>
              ))}
            </div>
            <div className="w-full py-4 rounded-xl text-sm font-black text-center text-white transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.2)] opacity-90 group-hover:opacity-100" style={{ background: `linear-gradient(${lc.gradient})` }}>
              {t("LÀM BÀI NGAY", "START NOW")}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
