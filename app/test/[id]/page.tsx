"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";

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

/** Returns all questions in stable display order: part order → passage order → local position.
 *  Does NOT rely on question_number for global ordering to avoid duplicates across parts. */
function buildOrderedQuestions(exam: Exam): Question[] {
  const result: Question[] = [];
  const sortedParts = [...exam.parts].sort((a, b) => a.part_number - b.part_number);
  for (const part of sortedParts) {
    if (part.part_number === 1) {
      const qs = [...(part.questions || [])].sort(
        (a, b) => (a.question_number || 0) - (b.question_number || 0)
      );
      result.push(...qs);
    } else {
      const passages = [...(part.passages || [])].sort(
        (a, b) => (a.passage_order || 0) - (b.passage_order || 0)
      );
      for (const pg of passages) {
        const qs = [...(pg.questions || [])].sort(
          (a, b) => (a.question_number || 0) - (b.question_number || 0)
        );
        result.push(...qs);
      }
    }
  }
  return result;
}

/** Maps questionId → 1-based number within its own part (resets per part) */
function buildGlobalNumMap(exam: Exam): Map<number, number> {
  const map = new Map<number, number>();
  const sortedParts = [...exam.parts].sort((a, b) => a.part_number - b.part_number);
  for (const part of sortedParts) {
    let n = 1;
    if (part.part_number === 1) {
      [...(part.questions || [])]
        .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
        .forEach((q) => map.set(q.id, n++));
    } else {
      [...(part.passages || [])]
        .sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0))
        .forEach((pg) =>
          [...(pg.questions || [])]
            .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
            .forEach((q) => map.set(q.id, n++))
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
  question,
  globalNumber,
  selected,
  onSelect,
  submitted,
}: {
  question: Question;
  globalNumber: number;
  selected?: number;
  onSelect: (optionId: number) => void;
  submitted: boolean;
}) {
  const sortedOptions = [...(question.options || [])].sort((a, b) =>
    a.option_label.localeCompare(b.option_label)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Question header */}
      <div className="flex gap-3 mb-4">
        <span
          className={`shrink-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {globalNumber}
        </span>
        <p className="text-gray-900 font-medium text-sm leading-relaxed pt-1">{question.content}</p>
      </div>

      {question.audio_url && (
        <div className="mb-4 bg-gray-50 rounded-lg p-2">
          <audio controls src={question.audio_url} className="w-full h-9" />
        </div>
      )}

      <div className="space-y-2">
        {sortedOptions.map((option) => {
          const isSelected = selected === option.id;
          const isCorrect = submitted && option.is_correct;
          const isWrong = submitted && isSelected && !option.is_correct;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition text-sm flex items-start gap-3 disabled:cursor-default ${
                isCorrect
                  ? "bg-green-50 border-green-400 text-green-800"
                  : isWrong
                  ? "bg-red-50 border-red-400 text-red-800"
                  : isSelected
                  ? "bg-blue-50 border-blue-400 text-blue-800"
                  : "bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700"
              }`}
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 ${
                  isCorrect
                    ? "bg-green-500 text-white"
                    : isWrong
                    ? "bg-red-500 text-white"
                    : isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {option.option_label}
              </span>
              <span className="flex-1">{option.content}</span>
              {isCorrect && <span className="ml-auto shrink-0 text-green-600 font-bold">✓</span>}
              {isWrong && <span className="ml-auto shrink-0 text-red-500 font-bold">✗</span>}
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
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPart, setSelectedPart] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    testsApi
      .getFullStructure(examId)
      .then((res) => {
        const data = res?.data;
        if (!data) throw new Error("Exam not found");
        setExam(data);
        const duration = data.total_duration
          ? data.total_duration * 60
          : (data.parts || []).reduce((sum: number, p: Part) => sum + (p.duration || 0), 0);
        setTimeLeft(duration || null);
      })
      .catch((err: any) => setError(err?.message || "Failed to load exam"))
      .finally(() => setIsLoading(false));
  }, [examId]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, submitted]);

  // ── Build ordered question list + global number map ──────────────────────
  const orderedQuestions = useMemo(() => (exam ? buildOrderedQuestions(exam) : []), [exam]);
  const globalNumMap = useMemo(() => (exam ? buildGlobalNumMap(exam) : new Map<number, number>()), [exam]);

  const handleAnswer = (questionId: number, optionId: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    if (submitted) return;
    const totalDuration = exam
      ? (exam.total_duration
          ? exam.total_duration * 60
          : (exam.parts || []).reduce((sum: number, p: Part) => sum + (p.duration || 0), 0))
      : 0;
    const elapsed = timeLeft !== null ? totalDuration - timeLeft : undefined;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSubmitted(true);

    let correct = 0;
    orderedQuestions.forEach((q) => {
      const selId = answers[q.id];
      if (!selId) return;
      const opt = q.options?.find((o) => o.id === selId);
      if ((opt as any)?.is_correct) correct++;
    });
    const finalScore = { correct, total: orderedQuestions.length };
    setScore(finalScore);

    try {
      sessionStorage.setItem(
        `review_${examId}`,
        JSON.stringify({ answers, score: finalScore, timeSpent: elapsed })
      );
    } catch {}
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = orderedQuestions.length;

  // ── Per-part helpers ─────────────────────────────────────────────────────
  const getPartQIds = (part: Part): number[] => {
    const ids: number[] = [];
    if (part.part_number === 1) {
      (part.questions || []).forEach((q) => ids.push(q.id));
    } else {
      [...(part.passages || [])]
        .sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0))
        .forEach((pg) =>
          [...(pg.questions || [])]
            .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
            .forEach((q) => ids.push(q.id))
        );
    }
    return ids;
  };

  // ── Loading / Error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading exam…</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Exam not found"}</p>
          <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Score screen ─────────────────────────────────────────────────────────
  if (submitted && score) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
            <div className="text-7xl mb-4">
              {percentage >= 80 ? "🏆" : percentage >= 60 ? "🎯" : "📚"}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Test Complete!</h1>
            <p className="text-gray-400 mb-8">{exam.title}</p>

            {/* Score ring */}
            <div className="relative inline-block mb-8">
              <div
                className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-8 ${
                  percentage >= 80
                    ? "border-green-400 bg-green-50"
                    : percentage >= 60
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-red-400 bg-red-50"
                }`}
              >
                <span
                  className={`text-4xl font-bold ${
                    percentage >= 80 ? "text-green-600" : percentage >= 60 ? "text-yellow-600" : "text-red-500"
                  }`}
                >
                  {percentage}%
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {score.correct}/{score.total}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-8 font-medium">
              {percentage >= 80
                ? "Excellent! Outstanding performance."
                : percentage >= 60
                ? "Good job! Keep it up."
                : "Keep practicing! You'll do better next time."}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8 text-sm">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600">{score.correct}</div>
                <div className="text-gray-500 text-xs mt-1">Correct</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-500">{score.total - score.correct}</div>
                <div className="text-gray-500 text-xs mt-1">Incorrect</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-500">{totalQuestions - answeredCount}</div>
                <div className="text-gray-500 text-xs mt-1">Skipped</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/">
                <button className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
                  ← Home
                </button>
              </Link>
              <Link href={`/test/${examId}/review`}>
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm">
                  Review Answers →
                </button>
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                  setSelectedPart(0);
                  setScore(null);
                  setTimeLeft(
                    exam.total_duration
                      ? exam.total_duration * 60
                      : (exam.parts || []).reduce((s: number, p: Part) => s + (p.duration || 0), 0) || null
                  );
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main test UI ─────────────────────────────────────────────────────────
  const sortedParts = [...exam.parts].sort((a, b) => a.part_number - b.part_number);
  const currentPart = sortedParts[selectedPart];

  return (
    <div className="min-h-screen bg-gray-50 pt-14 pb-12">
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm shrink-0">← Exit</Link>
            <span className="text-gray-200">|</span>
            <h1 className="font-semibold text-gray-900 text-sm truncate">{exam.title}</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Progress bar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-xs text-gray-500 tabular-nums">{answeredCount}/{totalQuestions}</span>
            </div>

            {timeLeft !== null && (
              <span
                className={`font-mono font-semibold text-sm px-3 py-1 rounded-lg tabular-nums ${
                  timeLeft < 300 ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-700"
                }`}
              >
                ⏱ {formatTime(timeLeft)}
              </span>
            )}

            <button
              onClick={() => {
                const unanswered = totalQuestions - answeredCount;
                if (unanswered > 0 && !confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;
                handleSubmit();
              }}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Part tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Parts</h3>
                <div className="space-y-2">
                  {sortedParts.map((part, idx) => {
                    const partQIds = getPartQIds(part);
                    const partAnswered = partQIds.filter((id) => answers[id]).length;
                    const isCurrent = selectedPart === idx;
                    return (
                      <button
                        key={part.id}
                        onClick={() => setSelectedPart(idx)}
                        className={`w-full text-left px-3 py-3 rounded-lg transition text-sm ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Part {part.part_number}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              isCurrent ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {partAnswered}/{partQIds.length}
                          </span>
                        </div>
                        <div
                          className={`text-xs mt-1 truncate ${
                            isCurrent ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {part.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question grid — global sequential numbers */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Part {currentPart.part_number} Questions
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {getPartQIds(currentPart).map((qId, idx) => {
                    const n = idx + 1;
                    const isAnswered = !!answers[qId];
                    return (
                      <div
                        key={qId}
                        title={`Question ${n}`}
                        className={`w-7 h-7 rounded text-[11px] font-semibold flex items-center justify-center cursor-default transition ${
                          isAnswered
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Answered
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Unanswered
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">
            {currentPart && (
              <>
                {/* Part header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mb-2">
                        Part {currentPart.part_number}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900">{currentPart.title}</h2>
                    </div>
                    {(() => {
                      const partQIds = getPartQIds(currentPart);
                      const partAnswered = partQIds.filter((id) => answers[id]).length;
                      return (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">{partAnswered}/{partQIds.length}</div>
                          <div className="text-xs text-gray-400">answered</div>
                        </div>
                      );
                    })()}
                  </div>
                  {currentPart.audio_url && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                        Part Audio
                      </p>
                      <audio controls src={currentPart.audio_url} className="w-full h-10" />
                    </div>
                  )}
                </div>

                {/* Part 1: direct questions */}
                {currentPart.part_number === 1 && (
                  <div className="space-y-4">
                    {[...(currentPart.questions || [])]
                      .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
                      .map((q) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          globalNumber={globalNumMap.get(q.id) ?? q.question_number}
                          selected={answers[q.id]}
                          onSelect={(optId) => handleAnswer(q.id, optId)}
                          submitted={submitted}
                        />
                      ))}
                  </div>
                )}

                {/* Part 2 & 3: passages */}
                {currentPart.part_number >= 2 && (
                  <div className="space-y-5">
                    {[...(currentPart.passages || [])]
                      .sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0))
                      .map((passage) => {
                        const passageQs = [...(passage.questions || [])].sort(
                          (a, b) => (a.question_number || 0) - (b.question_number || 0)
                        );
                        return (
                          <div
                            key={passage.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                          >
                            {/* Passage header */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-100">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-base">
                                    {passage.title || `Passage ${passage.passage_order}`}
                                  </h3>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {passageQs.length} question{passageQs.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                                {(() => {
                                  const answered = passageQs.filter((q) => answers[q.id]).length;
                                  return (
                                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                                      {answered}/{passageQs.length} answered
                                    </span>
                                  );
                                })()}
                              </div>
                              {passage.audio_url && (
                                <div className="mt-3">
                                  <audio controls src={passage.audio_url} className="w-full h-10" />
                                </div>
                              )}
                            </div>

                            {/* Questions */}
                            <div className="p-5 space-y-4">
                              {passageQs.map((q) => (
                                <QuestionCard
                                  key={q.id}
                                  question={q}
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

                {/* Empty state */}
                {(currentPart.questions || []).length === 0 &&
                  (currentPart.passages || []).length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center text-yellow-800 text-sm">
                      No questions available for this part yet.
                    </div>
                  )}

                {/* Part navigation */}
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setSelectedPart((p) => Math.max(0, p - 1))}
                    disabled={selectedPart === 0}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  {selectedPart < sortedParts.length - 1 ? (
                    <button
                      onClick={() => setSelectedPart((p) => p + 1)}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Next Part →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const unanswered = totalQuestions - answeredCount;
                        if (unanswered > 0 && !confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;
                        handleSubmit();
                      }}
                      className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold"
                    >
                      Submit Test ✓
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
