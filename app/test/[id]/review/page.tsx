"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { useLang } from "@/lib/lang";

// ==================== Types ====================
interface Option {
  id: number;
  option_label: string;
  content: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  question_number: number;
  content: string;
  script?: string;
  audio_url?: string;
  options: Option[];
}

interface Passage {
  id: number;
  title: string;
  audio_url?: string;
  script?: string;
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
  parts: Part[];
}

interface ReviewSession {
  answers: Record<number, number>;
  score: { correct: number; total: number };
  timeSpent?: number;
}

// ==================== Helpers ====================
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

type OptionStatus = "correct" | "wrong" | "missed" | "default";

function getOptionStatus(option: Option, selectedId: number | undefined): OptionStatus {
  const isSelected = selectedId === option.id;
  const isCorrect = !!(option as any).is_correct;
  if (isCorrect && isSelected) return "correct";
  if (isCorrect && !isSelected) return "missed";
  if (!isCorrect && isSelected) return "wrong";
  return "default";
}

// ==================== ScriptBlock ====================
function ScriptBlock({ script, label = "Script / Transcript" }: { script: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.2)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors"
        style={{ background: "rgba(124,58,237,0.08)", color: "#a78bfa" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.12)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.08)"}
      >
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {label}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            borderTop: "1px solid rgba(124,58,237,0.15)",
          }}
        >
          {script}
        </div>
      )}
    </div>
  );
}

// ==================== QuestionReview ====================
function QuestionReview({
  question, selectedOptionId, globalNumber,
}: {
  question: Question; selectedOptionId: number | undefined; globalNumber: number;
}) {
  const { t } = useLang();
  const isAnswered = selectedOptionId !== undefined;
  const selectedOption = question.options.find((o) => o.id === selectedOptionId);
  const isCorrect = !!(selectedOption as any)?.is_correct;

  let borderColor = "var(--border-subtle)";
  let bg = "var(--bg-surface)";
  let numBg = "var(--bg-elevated)";
  let numColor = "var(--text-muted)";

  if (isAnswered && isCorrect) {
    borderColor = "rgba(16,185,129,0.25)"; bg = "rgba(16,185,129,0.03)";
    numBg = "rgba(16,185,129,0.2)"; numColor = "#10b981";
  } else if (isAnswered && !isCorrect) {
    borderColor = "rgba(244,63,94,0.25)"; bg = "rgba(244,63,94,0.03)";
    numBg = "rgba(244,63,94,0.2)"; numColor = "#f43f5e";
  }

  const STATUS_STYLE: Record<OptionStatus, { bg: string; border: string; color: string; labelBg: string; labelColor: string }> = {
    correct: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.35)", color: "#10b981", labelBg: "rgba(16,185,129,0.2)", labelColor: "#10b981" },
    wrong: { bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.35)", color: "#fb7185", labelBg: "rgba(244,63,94,0.2)", labelColor: "#fb7185" },
    missed: { bg: "rgba(16,185,129,0.05)", border: "rgba(16,185,129,0.2)", color: "#6ee7b7", labelBg: "rgba(16,185,129,0.12)", labelColor: "#6ee7b7" },
    default: { bg: "transparent", border: "var(--border-subtle)", color: "var(--text-muted)", labelBg: "var(--bg-elevated)", labelColor: "var(--text-muted)" },
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: bg, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className="shrink-0 w-8 h-8 rounded-xl text-sm font-black flex items-center justify-center"
          style={{ background: numBg, color: numColor }}
        >
          {globalNumber}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>{question.content}</p>
          {!isAnswered && (
            <span
              className="inline-block mt-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(148,163,184,0.1)", color: "var(--text-muted)" }}
            >
              {t("Chưa trả lời", "Not answered")}
            </span>
          )}
        </div>
        {isAnswered && (
          <span className={`shrink-0 text-lg font-bold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
            {isCorrect ? "✓" : "✗"}
          </span>
        )}
      </div>

      {question.audio_url && (
        <div className="mb-3 p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <audio controls src={question.audio_url} className="w-full h-9" />
        </div>
      )}

      <div className="space-y-2">
        {[...question.options].sort((a, b) => a.option_label.localeCompare(b.option_label)).map((option) => {
          const status = getOptionStatus(option, selectedOptionId);
          const s = STATUS_STYLE[status];
          return (
            <div
              key={option.id}
              className="flex items-start gap-3 px-4 py-2.5 rounded-xl text-sm"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <span
                className="font-bold shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs mt-0.5"
                style={{ background: s.labelBg, color: s.labelColor }}
              >
                {option.option_label}
              </span>
              <span className="flex-1" style={{ color: s.color }}>{option.content}</span>
              {(status === "correct" || status === "missed") && (
                <span className="shrink-0 text-emerald-400 font-bold">✓</span>
              )}
              {status === "wrong" && (
                <span className="shrink-0 text-rose-400 font-bold">✗</span>
              )}
            </div>
          );
        })}
      </div>

      {isAnswered && !isCorrect && selectedOption && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(244,63,94,0.3)" }} />
            {t("Bạn chọn:", "Your choice:")} {selectedOption.option_label}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(16,185,129,0.3)" }} />
            {t("Đáp án:", "Answer:")} {question.options.find((o) => !!(o as any).is_correct)?.option_label}
          </span>
        </div>
      )}

      {question.script && <ScriptBlock script={question.script} label={t("Giải thích / Script", "Explanation / Script")} />}
    </div>
  );
}

// ==================== Main Page ====================
export default function ReviewPage() {
  const params = useParams();
  const examId = params.id as string;
  const { t } = useLang();

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePart, setActivePart] = useState(0);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem(`review_${examId}`);
    if (!raw) {
      setError(t("Không tìm thấy kết quả. Vui lòng làm bài trước.", "No results found. Please take the test first."));
      setIsLoading(false);
      return;
    }
    try { setSession(JSON.parse(raw)); } catch {
      setError(t("Không thể tải dữ liệu kết quả.", "Failed to load result data."));
      setIsLoading(false);
      return;
    }
    testsApi.getFullStructure(examId)
      .then((res) => {
        const data = res?.data;
        if (!data) throw new Error(t("Không tìm thấy đề thi", "Exam not found"));
        setExam(data);
      })
      .catch((err: any) => setError(err?.message || t("Không tải được đề thi", "Failed to load exam")))
      .finally(() => setIsLoading(false));
  }, [examId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border-default)", borderTopColor: "#7c3aed" }} />
      </div>
    );
  }

  if (error || !exam || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <p className="text-rose-400 mb-5">{error || t("Không tìm thấy kết quả", "Results not found")}</p>
          <Link href={`/test/${examId}`}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            {t("Làm bài thi", "Take test")}
          </Link>
        </div>
      </div>
    );
  }

  const { answers, score } = session;
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const isExcellent = percentage >= 80;
  const isGood = percentage >= 60;
  const scoreColor = isExcellent ? "#10b981" : isGood ? "#f59e0b" : "#f43f5e";

  const getPartQuestions = (part: Part) => {
    const result: { question: Question }[] = [];
    if (part.questions?.length) part.questions.forEach((q) => result.push({ question: q }));
    part.passages?.forEach((pg) => pg.questions?.forEach((q) => result.push({ question: q })));
    return result.sort((a, b) => (a.question.question_number || 0) - (b.question.question_number || 0));
  };

  const getPartScore = (part: Part) => {
    const qs = getPartQuestions(part);
    let correct = 0;
    qs.forEach(({ question }) => {
      const selId = answers[question.id];
      if (!selId) return;
      const opt = question.options.find((o) => o.id === selId);
      if (opt?.is_correct) correct++;
    });
    return { correct, total: qs.length };
  };

  const sortedParts = [...exam.parts].sort((a, b) => a.part_number - b.part_number);
  const currentPart = sortedParts[activePart];
  const currentPartScore = getPartScore(currentPart);

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link
              href={`/test/${examId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-3 transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#a78bfa"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("Làm lại bài thi", "Retake test")}
            </Link>
            <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{exam.title}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{t("Xem lại đáp án", "Review answers")}</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
          >
            {t("Về trang chủ", "Home")}
          </Link>
        </div>

        {/* Score summary */}
        <div
          className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 80% at 0% 50%, ${scoreColor}12 0%, transparent 60%)`,
            }}
          />
          <div className="relative flex flex-wrap items-center gap-6">
            {/* Score */}
            <div className="text-center min-w-[90px]">
              <div
                className="text-5xl font-black"
                style={{ color: scoreColor }}
              >
                {percentage}%
              </div>
              <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {score.correct}/{score.total} {t("đúng", "correct")}
              </div>
            </div>

            <div className="w-px h-14 hidden sm:block" style={{ background: "var(--border-subtle)" }} />

            {/* Per-part */}
            <div className="flex flex-wrap gap-3 flex-1">
              {sortedParts.map((part, idx) => {
                const ps = getPartScore(part);
                const pct = ps.total > 0 ? Math.round((ps.correct / ps.total) * 100) : 0;
                const isActive = activePart === idx;
                return (
                  <button
                    key={part.id}
                    onClick={() => setActivePart(idx)}
                    className="text-center px-4 py-3 rounded-2xl transition-all duration-200"
                    style={{
                      background: isActive ? "rgba(124,58,237,0.15)" : "var(--bg-elevated)",
                      border: `1px solid ${isActive ? "rgba(124,58,237,0.35)" : "var(--border-subtle)"}`,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.border = "1px solid var(--border-default)";
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.border = "1px solid var(--border-subtle)";
                    }}
                  >
                    <div className="text-xs font-bold uppercase mb-0.5" style={{ color: "var(--text-muted)" }}>
                      Part {part.part_number}
                    </div>
                    <div
                      className="text-xl font-black"
                      style={{ color: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#f43f5e" }}
                    >
                      {ps.correct}/{ps.total}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{pct}%</div>
                  </button>
                );
              })}
            </div>

            {session.timeSpent !== undefined && (
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: "var(--text-secondary)" }}>
                  {formatTime(session.timeSpent)}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{t("Thời gian", "Time")}</div>
              </div>
            )}
          </div>

          {/* Performance banner */}
          <div
            className="mt-5 rounded-xl px-4 py-3 text-sm font-medium text-center"
            style={{
              background: isExcellent ? "rgba(16,185,129,0.08)" : isGood ? "rgba(245,158,11,0.08)" : "rgba(244,63,94,0.08)",
              border: `1px solid ${isExcellent ? "rgba(16,185,129,0.2)" : isGood ? "rgba(245,158,11,0.2)" : "rgba(244,63,94,0.2)"}`,
              color: scoreColor,
            }}
          >
            {isExcellent
              ? t("🏆 Xuất sắc! Bạn đã nắm vững toàn bộ bài thi.", "🏆 Excellent! You've mastered the entire test.")
              : isGood
              ? t("🎯 Khá tốt! Xem lại các câu sai để cải thiện thêm.", "🎯 Good job! Review wrong answers to improve.")
              : t("📚 Cần luyện tập thêm! Đọc kỹ phần giải thích bên dưới.", "📚 Keep practicing! Read the explanations below.")}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div
            className="rounded-2xl px-5 py-3.5 mb-5 flex flex-wrap items-center gap-4 text-xs"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="font-bold" style={{ color: "var(--text-secondary)" }}>{t("Chú thích:", "Legend:")}</span>
            {[
              { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.35)", label: t("Đúng (bạn chọn)", "Correct (your choice)") },
              { bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.35)", label: t("Sai (bạn chọn)", "Wrong (your choice)") },
              { bg: "rgba(16,185,129,0.05)", border: "rgba(16,185,129,0.2)", label: t("Đáp án đúng (chưa chọn)", "Correct answer (not chosen)") },
              { bg: "transparent", border: "var(--border-subtle)", label: t("Đáp án khác", "Other option") },
            ].map(({ bg, border, label }) => (
              <span key={label} className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <span
                  className="w-4 h-4 rounded-md inline-block"
                  style={{ background: bg, border: `1px solid ${border}` }}
                />
                {label}
              </span>
            ))}
            <button
              onClick={() => setShowLegend(false)}
              className="ml-auto transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Part tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {sortedParts.map((part, idx) => {
            const ps = getPartScore(part);
            const isActive = activePart === idx;
            return (
              <button
                key={part.id}
                onClick={() => setActivePart(idx)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
                style={{
                  background: isActive ? "rgba(124,58,237,0.15)" : "var(--bg-surface)",
                  border: `1px solid ${isActive ? "rgba(124,58,237,0.35)" : "var(--border-default)"}`,
                  color: isActive ? "#a78bfa" : "var(--text-secondary)",
                }}
              >
                Part {part.part_number}
                <span className="ml-2 text-xs" style={{ color: isActive ? "#7c6ae8" : "var(--text-muted)" }}>
                  {ps.correct}/{ps.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Part header */}
        <div
          className="rounded-2xl px-6 py-4 mb-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{currentPart.title}</h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {currentPartScore.correct}/{currentPartScore.total} {t("đúng", "correct")}
                {" · "}
                {currentPartScore.total > 0 ? Math.round((currentPartScore.correct / currentPartScore.total) * 100) : 0}%
              </p>
            </div>
            {currentPart.audio_url && (
              <audio controls src={currentPart.audio_url} className="h-9 max-w-xs" />
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {currentPart.part_number === 1 ? (
            [...(currentPart.questions || [])]
              .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
              .map((q, qi) => (
                <QuestionReview key={q.id} question={q} selectedOptionId={answers[q.id]} globalNumber={qi + 1} />
              ))
          ) : (
            (() => {
              let counter = 0;
              return [...(currentPart.passages || [])]
                .sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0))
                .map((passage) => {
                  const passageQs = [...(passage.questions || [])].sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
                  return (
                    <div
                      key={passage.id}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div
                        className="px-6 py-4"
                        style={{
                          background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(6,182,212,0.04) 100%)",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
                          {passage.title || t(`Đoạn ${passage.passage_order}`, `Passage ${passage.passage_order}`)}
                        </h3>
                        {passage.audio_url && (
                          <audio controls src={passage.audio_url} className="mt-2 w-full h-9" />
                        )}
                        {passage.script && (
                          <ScriptBlock script={passage.script} label={t("Script hội thoại / bài nghe", "Dialogue / Listening script")} />
                        )}
                      </div>
                      <div className="p-5 space-y-5">
                        {passageQs.map((q) => {
                          counter++;
                          return (
                            <QuestionReview
                              key={q.id} question={q}
                              selectedOptionId={answers[q.id]}
                              globalNumber={counter}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                });
            })()
          )}

          {(currentPart.questions || []).length === 0 && (currentPart.passages || []).length === 0 && (
            <div
              className="rounded-2xl p-6 text-center text-sm"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
            >
              {t("Không có câu hỏi cho phần này.", "No questions for this part.")}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button
            onClick={() => setActivePart((p) => Math.max(0, p - 1))}
            disabled={activePart === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
          >
            ← {t("Phần trước", "Previous")}
          </button>
          {activePart < exam.parts.length - 1 ? (
            <button
              onClick={() => setActivePart((p) => p + 1)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
            >
              {t("Phần tiếp →", "Next →")}
            </button>
          ) : (
            <Link
              href={`/test/${examId}`}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
            >
              {t("Làm lại bài thi", "Retake test")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
