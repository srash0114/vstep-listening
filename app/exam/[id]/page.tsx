"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

const LEVEL_CONFIG: Record<string, { gradient: string; text: string; bg: string; border: string }> = {
  "B1": { gradient: "135deg, #10b981, #14b8a6", text: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  "B2": { gradient: "135deg, #06b6d4, #3b82f6", text: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
  "B1-B2": { gradient: "135deg, #8b5cf6, #06b6d4", text: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  "C1": { gradient: "135deg, #a855f7, #ec4899", text: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)" },
  "C2": { gradient: "135deg, #f43f5e, #f97316", text: "#f43f5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)" },
};

const DEFAULT_LEVEL = { gradient: "135deg, #64748b, #94a3b8", text: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" };

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLang();
  const examId = params.id as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testsApi.getForTaking(examId)
      .then((res) => {
        if (res.success && res.data) {
          setExam(res.data);
        } else {
          setError(res.message || "Exam not found");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load exam details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ background: "var(--bg-base)" }}>
        <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-default)", borderTopColor: "#7c3aed" }} />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20" style={{ background: "var(--bg-base)" }}>
        <p className="text-xl mb-4" style={{ color: "var(--accent-rose)" }}>{error || "Exam not found"}</p>
        <Link href="/" className="px-6 py-2 rounded-xl text-white font-medium" style={{ background: "var(--accent-violet)" }}>
          Chuyển về trang chủ
        </Link>
      </div>
    );
  }

  const lc = LEVEL_CONFIG[exam.level ?? ""] ?? DEFAULT_LEVEL;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="mb-6">
          <button onClick={() => router.push("/")} className="text-sm flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("Về Thư viện", "Back to Library")}
          </button>
        </div>

        {/* Detailed Card */}
        <div className="rounded-[2.5rem] overflow-hidden" 
             style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
          
          <div className="relative w-full h-64 sm:h-80 overflow-hidden" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop')`, opacity: 0.9 }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] to-transparent opacity-90" />
            
            <div className="absolute bottom-6 left-6 sm:left-10 flex flex-wrap items-center gap-3">
              {exam.level && (
                <span className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-wider px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl" style={{ color: lc.text, border: `1px solid ${lc.border}` }}>
                  {exam.level}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-sm font-medium px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl text-white">
                🎧 VSTEP Listening
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(${lc.gradient})` }}>
              {exam.title}
            </h1>
            
            {exam.description && (
              <p className="text-base sm:text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {exam.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex-1 min-w-[200px] p-5 rounded-2xl flex flex-col gap-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <span className="text-2xl">📝</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("Số câu hỏi", "Questions")}</p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{exam.total_questions ?? 35}</p>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] p-5 rounded-2xl flex flex-col gap-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("Thời gian", "Duration")}</p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{exam.total_duration ?? 35} {t("phút", "minutes")}</p>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] p-5 rounded-2xl flex flex-col gap-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <span className="text-2xl">📚</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("Cấu trúc", "Structure")}</p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>3 Parts</p>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 flex justify-end">
              <Link href={`/test/${exam.id}`} 
                    className="w-full sm:w-auto text-center px-10 py-5 rounded-2xl text-lg font-black text-white hover:scale-105 transition-transform shadow-[0_10px_20px_rgba(0,0,0,0.2)]" 
                    style={{ background: `linear-gradient(${lc.gradient})` }}>
                {t("BẮT ĐẦU LÀM BÀI", "START PRACTICE")}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
