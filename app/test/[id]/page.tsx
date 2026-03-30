"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { testsApi, userExamsApi, API_BASE_URL } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { useAuth } from "@/lib/auth-context";
import { CachedAudio } from "@/components/CachedAudio";

// ==================== Types ====================
interface Option {
  id: number;
  option_label: string;
  content: string;
  is_correct?: boolean;
}

interface Question {
  id: number;
  question_number: number;
  content: string;
  audio_url?: string;
  options: Option[];
}

interface Passage {
  id: number;
  title: string;
  audio_url?: string;
  passage_order: number;
  questions: Question[];
}

interface Part {
  id: number;
  part_number: number;
  title: string;
  audio_url?: string;
  duration: number;
  questions: Question[];
  passages: Passage[];
}

interface Exam {
  id: number;
  title: string;
  description?: string;
  level?: string;
  total_duration?: number;
  total_questions?: number;
  parts: Part[];
}

// ==================== Helpers ====================
function buildOrderedQuestions(exam: Exam): Question[] {
  const result: Question[] = [];
  const sortedParts = [...exam.parts].sort((a, b) => a.part_number - b.part_number);
  for (const part of sortedParts) {
    if (part.part_number === 1) {
      result.push(...[...(part.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0)));
    } else {
      const passages = [...(part.passages || [])].sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0));
      for (const pg of passages) {
        result.push(...[...(pg.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0)));
      }
    }
  }
  return result;
}

function buildGlobalNumMap(exam: Exam): Map<number, number> {
  const map = new Map<number, number>();
  const sortedParts = [...exam.parts].sort((a, b) => a.part_number - b.part_number);
  for (const part of sortedParts) {
    let n = 1;
    if (part.part_number === 1) {
      [...(part.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0)).forEach((q) => map.set(q.id, n++));
    } else {
      [...(part.passages || [])].sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0)).forEach((pg) =>
        [...(pg.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0)).forEach((q) => map.set(q.id, n++))
      );
    }
  }
  return map;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ==================== QuestionCard ====================
function QuestionCard({
  question, globalNumber, selected, onSelect, submitted,
}: {
  question: Question; globalNumber: number; selected?: number; onSelect: (optionId: number) => void; submitted: boolean;
}) {
  const sortedOptions = [...(question.options || [])].sort((a, b) => a.option_label.localeCompare(b.option_label));

  return (
    <div
      id={`question-${question.id}`}
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: "var(--bg-surface)",
        border: selected ? "1px solid rgba(124,58,237,0.2)" : "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div className="flex gap-3 mb-4">
        <span
          className="shrink-0 w-8 h-8 rounded-xl text-sm font-black flex items-center justify-center"
          style={{
            background: selected ? "linear-gradient(135deg, #7c3aed, #06b6d4)" : "var(--bg-elevated)",
            color: selected ? "#fff" : "var(--text-muted)",
            border: selected ? "none" : "1px solid var(--border-default)",
          }}
        >
          {globalNumber}
        </span>
        <p className="text-sm leading-relaxed pt-1 font-medium" style={{ color: "var(--text-primary)" }}>
          {question.content}
        </p>
      </div>

      {question.audio_url && (
        <div
          className="mb-4 p-3 rounded-xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <CachedAudio src={question.audio_url} className="w-full h-9" />
        </div>
      )}

      <div className="space-y-2">
        {sortedOptions.map((option) => {
          const isSelected = selected === option.id;
          const isCorrect = submitted && option.is_correct;
          const isWrong = submitted && isSelected && !option.is_correct;

          let bg = "var(--bg-elevated)";
          let border = "var(--border-subtle)";
          let textColor = "var(--text-secondary)";
          let labelBg = "var(--bg-overlay)";
          let labelColor = "var(--text-muted)";

          if (isCorrect) {
            bg = "rgba(16,185,129,0.08)"; border = "rgba(16,185,129,0.35)"; textColor = "#10b981";
            labelBg = "rgba(16,185,129,0.2)"; labelColor = "#10b981";
          } else if (isWrong) {
            bg = "rgba(244,63,94,0.08)"; border = "rgba(244,63,94,0.35)"; textColor = "#fb7185";
            labelBg = "rgba(244,63,94,0.2)"; labelColor = "#fb7185";
          } else if (isSelected) {
            bg = "rgba(124,58,237,0.1)"; border = "rgba(124,58,237,0.4)"; textColor = "#a78bfa";
            labelBg = "rgba(124,58,237,0.25)"; labelColor = "#a78bfa";
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={submitted}
              className="w-full text-left px-4 py-3 rounded-xl transition-all duration-150 flex items-start gap-3 disabled:cursor-default group"
              style={{
                background: bg,
                border: `1px solid ${border}`,
              }}
              onMouseEnter={e => {
                if (!submitted && !isSelected) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.06)";
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(124,58,237,0.2)";
                }
              }}
              onMouseLeave={e => {
                if (!submitted && !isSelected) {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.border = `1px solid var(--border-subtle)`;
                }
              }}
            >
              <span
                className="shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center mt-0.5"
                style={{ background: labelBg, color: labelColor }}
              >
                {option.option_label}
              </span>
              <span className="flex-1 text-sm" style={{ color: textColor }}>{option.content}</span>
              {isCorrect && <span className="ml-auto shrink-0 text-emerald-400 font-bold">✓</span>}
              {isWrong && <span className="ml-auto shrink-0 text-rose-400 font-bold">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Main Page ====================
export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { t, tx } = useLang();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredForConfirm, setUnansweredForConfirm] = useState(0);
  const [userExamId, setUserExamId] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Refs for access in event handlers (avoid stale closures)
  const answersRef = useRef<Record<number, number>>({});
  const timeLeftRef = useRef<number | null>(null);
  const userExamIdRef = useRef<number | null>(null);
  const totalDurationRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const { user, isLoading: authLoading } = useAuth();

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { userExamIdRef.current = userExamId; }, [userExamId]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoading(false);
      return;
    }
    Promise.all([
      userExamsApi.start(examId),
      testsApi.getForTaking(examId),
    ])
      .then(([startRes, examRes]) => {
        const ueid = startRes?.data?.id ?? null;
        setUserExamId(ueid);
        const data = examRes?.data;
        if (!data) throw new Error(t("Không tìm thấy đề thi", "Exam not found"));
        setExam(data);

        const totalDuration = data.total_duration
          ? data.total_duration * 60
          : (data.parts || []).reduce((sum: number, p: Part) => sum + (p.duration || 0), 0);
        totalDurationRef.current = totalDuration;

        // Resume previous attempt
        if (startRes?.message === "Resuming existing exam" && startRes?.data) {
          const prev = startRes.data;
          // Restore answers
          if (Array.isArray(prev.answers) && prev.answers.length > 0) {
            const restored: Record<number, number> = {};
            prev.answers.forEach((a: any) => {
              if (a.selected_option_id != null) restored[a.question_id] = a.selected_option_id;
            });
            setAnswers(restored);
          }
          // Restore remaining time
          if (prev.time_spent != null && totalDuration > 0) {
            setTimeLeft(Math.max(0, totalDuration - prev.time_spent));
          } else {
            setTimeLeft(totalDuration || null);
          }
          setIsResuming(true);
          setTimeout(() => setIsResuming(false), 4000);
        } else {
          setTimeLeft(totalDuration || null);
        }
      })
      .catch((err: any) => setError(err?.message || t("Không tải được đề thi", "Failed to load exam")))
      .finally(() => setIsLoading(false));
  }, [examId, authLoading, user]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, submitted]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedPart]);

  // Auto-save silently on browser close/reload (no native dialog)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (submittedRef.current || !userExamIdRef.current) return;
      const elapsed = timeLeftRef.current !== null
        ? totalDurationRef.current - timeLeftRef.current
        : totalDurationRef.current;
      const payload = JSON.stringify({
        time_spent: Math.max(0, elapsed),
        answers: Object.entries(answersRef.current).map(([qId, optId]) => ({
          question_id: parseInt(qId),
          selected_option_id: optId,
        })),
      });
      fetch(`${API_BASE_URL}/api/v1/user-exams/${userExamIdRef.current}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
        credentials: "include",
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Intercept browser back button → show custom exit modal instead
  useEffect(() => {
    // Push a dummy state so popstate fires when user presses Back
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      if (submittedRef.current || !userExamIdRef.current) return;
      // Push back again to keep user on the page while modal is shown
      window.history.pushState(null, "", window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handlePauseAndExit = async () => {
    if (userExamIdRef.current) {
      const elapsed = timeLeftRef.current !== null
        ? totalDurationRef.current - timeLeftRef.current
        : totalDurationRef.current;
      try {
        await userExamsApi.pause(userExamIdRef.current, {
          time_spent: Math.max(0, elapsed),
          answers: Object.entries(answersRef.current).map(([qId, optId]) => ({
            question_id: parseInt(qId),
            selected_option_id: optId,
          })),
        });
      } catch {}
    }
    router.push("/");
  };

  const orderedQuestions = useMemo(() => (exam ? buildOrderedQuestions(exam) : []), [exam]);
  const globalNumMap = useMemo(() => (exam ? buildGlobalNumMap(exam) : new Map<number, number>()), [exam]);

  const handleAnswer = (questionId: number, optionId: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    if (userExamId) {
      userExamsApi.saveAnswer(userExamId, questionId, optionId).catch(() => {});
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    const totalDuration = exam
      ? (exam.total_duration ? exam.total_duration * 60 : (exam.parts || []).reduce((s: number, p: Part) => s + (p.duration || 0), 0))
      : 0;
    const elapsed = timeLeft !== null ? totalDuration - timeLeft : 0;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSubmitted(true);
    if (userExamId) {
      try {
        const res = await userExamsApi.submit(userExamId, elapsed);
        const d = res?.data;
        setScore({ correct: d.correct_answers, total: d.total_questions });
        try {
          sessionStorage.setItem(`review_${examId}`, JSON.stringify({ userExamId, timeSpent: d.time_spent }));
        } catch {}
      } catch {
        setScore({ correct: 0, total: orderedQuestions.length });
      }
    } else {
      setScore({ correct: 0, total: orderedQuestions.length });
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = orderedQuestions.length;

  const getPartQIds = (part: Part): number[] => {
    const ids: number[] = [];
    if (part.part_number === 1) {
      (part.questions || []).forEach((q) => ids.push(q.id));
    } else {
      [...(part.passages || [])].sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0))
        .forEach((pg) => [...(pg.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0)).forEach((q) => ids.push(q.id)));
    }
    return ids;
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border-default)", borderTopColor: "#7c3aed" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("Đang tải đề thi...", "Loading exam...")}</p>
        </div>
      </div>
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
        <div
          className="w-full max-w-sm rounded-3xl p-8 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            🔒
          </div>
          <h2 className="text-lg font-black mb-2" style={{ color: "var(--text-primary)" }}>
            {t("Vui lòng đăng nhập", "Login required")}
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            {t("Vui lòng đăng nhập để có thể làm bài test nhé", "Please log in to take this test")}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
            >
              {t("Đăng nhập", "Log in")}
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              {t("Đã hiểu", "Got it")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <p className="mb-5 text-rose-400">{error || t("Không tìm thấy đề thi", "Exam not found")}</p>
          <Link href="/" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            {t("Về trang chủ", "Back to home")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Score screen ──
  if (submitted && score) {
    const percentage = Math.round((score.correct / score.total) * 100);
    const isExcellent = percentage >= 80;
    const isGood = percentage >= 60;
    const scoreColor = isExcellent ? "#10b981" : isGood ? "#f59e0b" : "#f43f5e";
    const scoreBg = isExcellent ? "rgba(16,185,129,0.12)" : isGood ? "rgba(245,158,11,0.12)" : "rgba(244,63,94,0.12)";
    const scoreBorder = isExcellent ? "rgba(16,185,129,0.3)" : isGood ? "rgba(245,158,11,0.3)" : "rgba(244,63,94,0.3)";

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-20"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${scoreBg.replace("0.12", "0.2")} 0%, transparent 60%), var(--bg-base)`,
        }}
      >
        <div className="w-full max-w-lg">
          <div
            className="rounded-3xl p-10 text-center"
            style={{
              background: "var(--bg-surface)",
              border: `1px solid ${scoreBorder}`,
              boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
            }}
          >
            <div className="text-6xl mb-6">
              {isExcellent ? "🏆" : isGood ? "🎯" : "📚"}
            </div>

            <h1 className="text-3xl font-black mb-1" style={{ color: "var(--text-primary)" }}>{t("Hoàn thành!", "Completed!")}</h1>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>{exam.title}</p>

            {/* Score ring */}
            <div
              className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full mb-8"
              style={{
                background: scoreBg,
                border: `4px solid ${scoreColor}`,
                boxShadow: `0 0 30px ${scoreBg}`,
              }}
            >
              <span className="text-4xl font-black" style={{ color: scoreColor }}>{percentage}%</span>
              <span className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {score.correct}/{score.total}
              </span>
            </div>

            <p className="mb-8 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {isExcellent
                ? t("Xuất sắc! Bạn đã làm rất tốt.", "Excellent! You did great.")
                : isGood
                ? t("Khá tốt! Tiếp tục cố gắng.", "Good job! Keep it up.")
                : t("Cần luyện tập thêm!", "Needs more practice!")}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { value: score.correct, label: t("Đúng", "Correct"), color: "#10b981", bg: "rgba(16,185,129,0.1)" },
                { value: score.total - score.correct, label: t("Sai", "Wrong"), color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
                { value: totalQuestions - answeredCount, label: t("Bỏ qua", "Skipped"), color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4"
                  style={{ background: s.bg, border: `1px solid ${s.bg.replace("0.1", "0.2").replace("0.08", "0.15")}` }}>
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                ← {t("Về nhà", "Home")}
              </Link>
              <Link href={`/test/${examId}/review${userExamId ? `?ueid=${userExamId}` : ""}`}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                {t("Xem đáp án →", "View answers →")}
              </Link>
              <button
                onClick={async () => {
                  try {
                    const startRes = await userExamsApi.start(examId);
                    setUserExamId(startRes?.data?.id ?? null);
                  } catch {}
                  setSubmitted(false); setAnswers({}); setSelectedPart(0); setScore(null);
                  setTimeLeft(exam.total_duration ? exam.total_duration * 60
                    : (exam.parts || []).reduce((s: number, p: Part) => s + (p.duration || 0), 0) || null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                {t("Làm lại", "Retry")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main test UI ──
  const sortedParts = [...exam.parts].sort((a, b) => a.part_number - b.part_number);
  const currentPart = sortedParts[selectedPart];
  const isLow = timeLeft !== null && timeLeft < 300;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--bg-base)" }}>

      {/* ── Fixed top bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(8,12,20,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: "var(--bg-elevated)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : "0%",
              background: "linear-gradient(to right, #7c3aed, #06b6d4)",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => submitted ? router.push("/") : setShowExitModal(true)}
              className="transition-colors text-xs shrink-0 flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("Thoát", "Exit")}
            </button>
            <span style={{ color: "var(--border-strong)" }}>│</span>
            <h1 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{exam.title}</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {answeredCount}/{totalQuestions}
              </span>
            </div>

            {timeLeft !== null && (
              <span
                className={`font-mono font-bold text-sm px-3 py-1.5 rounded-xl tabular-nums transition-all ${isLow ? "animate-pulse" : ""}`}
                style={{
                  background: isLow ? "rgba(244,63,94,0.15)" : "rgba(124,58,237,0.12)",
                  color: isLow ? "#fb7185" : "#a78bfa",
                  border: `1px solid ${isLow ? "rgba(244,63,94,0.3)" : "rgba(124,58,237,0.2)"}`,
                }}
              >
                {formatTime(timeLeft)}
              </span>
            )}

            <button
              onClick={() => {
                const unanswered = totalQuestions - answeredCount;
                if (unanswered > 0) {
                  setUnansweredForConfirm(unanswered);
                  setShowSubmitModal(true);
                  return;
                }
                handleSubmit();
              }}
              className="px-4 py-1.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
            >
              {t("Nộp bài", "Submit")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Part tabs */}
              <div
                className="rounded-2xl p-4"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                  Parts
                </h3>
                <div className="space-y-2">
                  {sortedParts.map((part, idx) => {
                    const partQIds = getPartQIds(part);
                    const partAnswered = partQIds.filter((id) => answers[id]).length;
                    const isCurrent = selectedPart === idx;
                    const pct = partQIds.length > 0 ? (partAnswered / partQIds.length) * 100 : 0;

                    return (
                      <button
                        key={part.id}
                        onClick={() => setSelectedPart(idx)}
                        className="w-full text-left px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
                        style={{
                          background: isCurrent ? "rgba(124,58,237,0.15)" : "var(--bg-elevated)",
                          border: `1px solid ${isCurrent ? "rgba(124,58,237,0.35)" : "var(--border-subtle)"}`,
                        }}
                        onMouseEnter={e => {
                          if (!isCurrent) {
                            (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.06)";
                            (e.currentTarget as HTMLElement).style.border = "1px solid var(--border-default)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isCurrent) {
                            (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                            (e.currentTarget as HTMLElement).style.border = "1px solid var(--border-subtle)";
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold" style={{ color: isCurrent ? "#a78bfa" : "var(--text-primary)" }}>
                            Part {part.part_number}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: isCurrent ? "#a78bfa" : "var(--text-muted)" }}>
                            {partAnswered}/{partQIds.length}
                          </span>
                        </div>
                        {/* Mini progress */}
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-overlay)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: isCurrent ? "#7c3aed" : "#475569" }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question grid */}
              <div
                className="rounded-2xl p-4"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                  {t("Câu hỏi", "Questions")} Part {currentPart.part_number}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {getPartQIds(currentPart).map((qId, idx) => {
                    const n = idx + 1;
                    const isAnswered = !!answers[qId];
                    return (
                      <div
                        key={qId}
                        className="w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all"
                        style={{
                          background: isAnswered ? "rgba(124,58,237,0.3)" : "var(--bg-elevated)",
                          color: isAnswered ? "#a78bfa" : "var(--text-muted)",
                          border: isAnswered ? "1px solid rgba(124,58,237,0.3)" : "1px solid var(--border-subtle)",
                        }}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.3)" }} /> {t("Đã trả lời", "Answered")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }} /> {t("Chưa trả lời", "Not answered")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-3 space-y-5">
            {currentPart && (
              <>
                {/* Part header */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span
                        className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2"
                        style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
                      >
                        Part {currentPart.part_number}
                      </span>
                      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{currentPart.title}</h2>
                    </div>
                    {(() => {
                      const partQIds = getPartQIds(currentPart);
                      const partAnswered = partQIds.filter((id) => answers[id]).length;
                      return (
                        <div className="text-right">
                          <div className="text-2xl font-black gradient-text">{partAnswered}/{partQIds.length}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{t("đã trả lời", "answered")}</div>
                        </div>
                      );
                    })()}
                  </div>

                  {currentPart.audio_url && (
                    <div className="mt-4 p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                        Audio Part
                      </p>
                      <CachedAudio src={currentPart.audio_url} className="w-full h-10" />
                    </div>
                  )}
                </div>

                {/* Part 1 — direct questions */}
                {currentPart.part_number === 1 && (
                  <div className="space-y-4">
                    {[...(currentPart.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0)).map((q) => (
                      <QuestionCard
                        key={q.id} question={q}
                        globalNumber={globalNumMap.get(q.id) ?? q.question_number}
                        selected={answers[q.id]}
                        onSelect={(optId) => handleAnswer(q.id, optId)}
                        submitted={submitted}
                      />
                    ))}
                  </div>
                )}

                {/* Part 2 & 3 — passages */}
                {currentPart.part_number >= 2 && (
                  <div className="space-y-5">
                    {[...(currentPart.passages || [])].sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0)).map((passage) => {
                      const passageQs = [...(passage.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
                      const answered = passageQs.filter((q) => answers[q.id]).length;
                      return (
                        <div
                          key={passage.id}
                          className="rounded-2xl overflow-hidden"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                        >
                          <div
                            className="px-6 py-4"
                            style={{
                              background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.05) 100%)",
                              borderBottom: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                                  {passage.title || t(`Đoạn ${passage.passage_order}`, `Passage ${passage.passage_order}`)}
                                </h3>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                  {passageQs.length} {t("câu hỏi", "questions")}
                                </p>
                              </div>
                              <span
                                className="text-xs font-bold px-3 py-1 rounded-full"
                                style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
                              >
                                {answered}/{passageQs.length}
                              </span>
                            </div>
                            {passage.audio_url && (
                              <div className="mt-3">
                                <CachedAudio src={passage.audio_url} className="w-full h-10" />
                              </div>
                            )}
                          </div>
                          <div className="p-5 space-y-4">
                            {passageQs.map((q) => (
                              <QuestionCard
                                key={q.id} question={q}
                                globalNumber={globalNumMap.get(q.id) ?? q.question_number}
                                selected={answers[q.id]}
                                onSelect={(optId) => handleAnswer(q.id, optId)}
                                submitted={submitted}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty */}
                {(currentPart.questions || []).length === 0 && (currentPart.passages || []).length === 0 && (
                  <div
                    className="rounded-2xl p-8 text-center text-sm"
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
                  >
                    {t("Chưa có câu hỏi cho phần này.", "No questions for this part.")}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setSelectedPart((p) => Math.max(0, p - 1))}
                    disabled={selectedPart === 0}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    ← {t("Phần trước", "Previous")}
                  </button>
                  {selectedPart < sortedParts.length - 1 ? (
                    <button
                      onClick={() => setSelectedPart((p) => p + 1)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
                    >
                      {t("Phần tiếp →", "Next →")}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const unanswered = totalQuestions - answeredCount;
                        if (unanswered > 0) {
                          setUnansweredForConfirm(unanswered);
                          setShowSubmitModal(true);
                          return;
                        }
                        handleSubmit();
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
                    >
                      {t("Nộp bài ✓", "Submit ✓")}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resume banner */}
      {isResuming && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl"
          style={{ background: "rgba(124,58,237,0.92)", color: "#fff", backdropFilter: "blur(12px)" }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("Đang tiếp tục bài làm trước của bạn...", "Resuming your previous attempt...")}
        </div>
      )}

      {/* Exit / Pause Modal */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
          onClick={() => setShowExitModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#a78bfa" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-black mb-2" style={{ color: "var(--text-primary)" }}>
              {t("Bạn muốn thoát?", "Leave the exam?")}
            </h2>
            <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
              {t(
                "Lưu lại tiến trình để tiếp tục bài làm sau. Câu trả lời và thời gian sẽ được giữ nguyên.",
                "Save your progress to resume later. Your answers and remaining time will be preserved."
              )}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handlePauseAndExit}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                {t("Lưu & Thoát", "Save & Exit")}
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              >
                {t("Thoát không lưu", "Exit without saving")}
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="text-sm py-2 transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
              >
                {t("Tiếp tục làm bài", "Continue exam")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 animate-in fade-in zoom-in-95"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#f59e0b" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Content */}
            <h2 className="text-xl font-black text-center mb-2" style={{ color: "var(--text-primary)" }}>
              {tx("confirmSubmission")}
            </h2>
            
            <p className="text-center text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              {tx("youHave")} <span className="font-bold" style={{ color: "#f59e0b" }}>{unansweredForConfirm}</span> {tx("unansweredQuestions")}
            </p>
            
            <p className="text-center text-xs mb-6" style={{ color: "var(--text-muted)" }}>
              {tx("doYouWantToSubmit")}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl p-3 text-center"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
                <p className="text-lg font-black" style={{ color: "#a78bfa" }}>{answeredCount}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{tx("answered")}</p>
              </div>
              <div className="rounded-xl p-3 text-center"
                style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <p className="text-lg font-black" style={{ color: "#fb7185" }}>{unansweredForConfirm}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{tx("skipped")}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)"
                }}
              >
                {tx("continueDoingTest")}
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmit();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
              >
                {tx("submitNow")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
