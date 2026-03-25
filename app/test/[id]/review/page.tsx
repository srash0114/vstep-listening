"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";

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
  description?: string;
  level?: string;
  parts: Part[];
}

interface ReviewSession {
  answers: Record<number, number>; // questionId -> optionId
  score: { correct: number; total: number };
  timeSpent?: number; // seconds
}

// ==================== Helpers ====================
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function getOptionStatus(
  option: Option,
  selectedId: number | undefined
): "correct" | "wrong" | "missed" | "selected" | "default" {
  const isSelected = selectedId === option.id;
  if (option.is_correct && isSelected) return "correct";
  if (option.is_correct && !isSelected) return "missed"; // correct but not chosen
  if (!option.is_correct && isSelected) return "wrong"; // chosen but wrong
  return "default";
}

// ==================== Sub-components ====================
function ScriptBlock({ script, label = "Script / Transcript" }: { script: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition"
      >
        <span>📖 {label}</span>
        <span>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div className="px-4 py-3 bg-white text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-blue-100">
          {script}
        </div>
      )}
    </div>
  );
}

function QuestionReview({
  question,
  selectedOptionId,
  globalNumber,
}: {
  question: Question;
  selectedOptionId: number | undefined;
  globalNumber: number;
}) {
  const isAnswered = selectedOptionId !== undefined;
  const selectedOption = question.options.find((o) => o.id === selectedOptionId);
  const isCorrect = selectedOption?.is_correct === true;

  return (
    <div
      className={`rounded-xl border-2 p-5 shadow-sm ${
        !isAnswered
          ? "border-gray-200 bg-white"
          : isCorrect
          ? "border-green-300 bg-green-50/30"
          : "border-red-300 bg-red-50/30"
      }`}
    >
      {/* Question header */}
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`shrink-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${
            !isAnswered
              ? "bg-gray-200 text-gray-500"
              : isCorrect
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {globalNumber}
        </span>
        <div className="flex-1">
          <p className="text-gray-900 font-medium text-sm leading-relaxed">{question.content}</p>
          {!isAnswered && (
            <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Not answered
            </span>
          )}
        </div>
        {isAnswered && (
          <span
            className={`shrink-0 text-lg ${isCorrect ? "text-green-500" : "text-red-500"}`}
          >
            {isCorrect ? "✓" : "✗"}
          </span>
        )}
      </div>

      {/* Audio */}
      {question.audio_url && (
        <div className="mb-3">
          <audio controls src={question.audio_url} className="w-full h-9" />
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        {[...question.options]
          .sort((a, b) => a.option_label.localeCompare(b.option_label))
          .map((option) => {
            const status = getOptionStatus(option, selectedOptionId);
            return (
              <div
                key={option.id}
                className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border text-sm ${
                  status === "correct"
                    ? "bg-green-100 border-green-400 text-green-800"
                    : status === "missed"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : status === "wrong"
                    ? "bg-red-100 border-red-400 text-red-800"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold shrink-0 w-5">{option.option_label}.</span>
                <span className="flex-1">{option.content}</span>
                <span className="shrink-0 text-base">
                  {status === "correct" && "✓"}
                  {status === "missed" && "✓"}
                  {status === "wrong" && "✗"}
                </span>
              </div>
            );
          })}
      </div>

      {/* Legend for this question */}
      {isAnswered && !isCorrect && selectedOption && (
        <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-300 inline-block" />
            Your answer: {selectedOption.option_label}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-300 inline-block" />
            Correct answer: {question.options.find((o) => o.is_correct)?.option_label}
          </span>
        </div>
      )}

      {/* Script / Explanation */}
      {question.script && <ScriptBlock script={question.script} label="Explanation / Script" />}
    </div>
  );
}

// ==================== Main Page ====================
export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePart, setActivePart] = useState(0);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    // Load session from sessionStorage
    const raw = sessionStorage.getItem(`review_${examId}`);
    if (!raw) {
      setError("No result found. Please take the test first.");
      setIsLoading(false);
      return;
    }
    try {
      setSession(JSON.parse(raw));
    } catch {
      setError("Could not load result data.");
      setIsLoading(false);
      return;
    }

    // Load exam structure
    testsApi
      .getFullStructure(examId)
      .then((res) => {
        const data = res?.data;
        if (!data) throw new Error("Exam not found");
        setExam(data);
      })
      .catch((err: any) => setError(err?.message || "Failed to load exam"))
      .finally(() => setIsLoading(false));
  }, [examId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !exam || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "No result found"}</p>
          <Link href={`/test/${examId}`} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Take the Test
          </Link>
        </div>
      </div>
    );
  }

  const { answers, score } = session;
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // Per-part stats
  const getPartQuestions = (part: Part): { question: Question; passageTitle?: string }[] => {
    const result: { question: Question; passageTitle?: string }[] = [];
    if (part.questions?.length) {
      part.questions.forEach((q) => result.push({ question: q }));
    }
    part.passages?.forEach((pg) => {
      pg.questions?.forEach((q) => result.push({ question: q, passageTitle: pg.title }));
    });
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link href={`/test/${examId}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Retake Test
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{exam.title}</h1>
            <p className="text-gray-500 text-sm">Answer Review</p>
          </div>
          <Link href="/" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            Back to Home
          </Link>
        </div>

        {/* Score summary card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Big score */}
            <div className="text-center min-w-[100px]">
              <div
                className={`text-5xl font-bold ${
                  percentage >= 80 ? "text-green-600" : percentage >= 60 ? "text-yellow-500" : "text-red-500"
                }`}
              >
                {percentage}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {score.correct}/{score.total} correct
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-gray-200 hidden sm:block" />

            {/* Per-part breakdown */}
            <div className="flex flex-wrap gap-4 flex-1">
              {sortedParts.map((part, idx) => {
                const ps = getPartScore(part);
                const pct = ps.total > 0 ? Math.round((ps.correct / ps.total) * 100) : 0;
                return (
                  <button
                    key={part.id}
                    onClick={() => setActivePart(idx)}
                    className={`text-center px-4 py-3 rounded-xl border-2 transition ${
                      activePart === idx
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 uppercase">Part {part.part_number}</div>
                    <div
                      className={`text-xl font-bold mt-0.5 ${
                        pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-500" : "text-red-500"
                      }`}
                    >
                      {ps.correct}/{ps.total}
                    </div>
                    <div className="text-xs text-gray-400">{pct}%</div>
                  </button>
                );
              })}
            </div>

            {/* Time spent */}
            {session.timeSpent !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">{formatTime(session.timeSpent)}</div>
                <div className="text-xs text-gray-400">Time spent</div>
              </div>
            )}
          </div>

          {/* Performance banner */}
          <div
            className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium text-center ${
              percentage >= 80
                ? "bg-green-50 text-green-800 border border-green-200"
                : percentage >= 60
                ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {percentage >= 80
              ? "Excellent! Great performance across all parts."
              : percentage >= 60
              ? "Good job! Review the missed questions below to improve."
              : "Keep practicing! Study the explanations carefully to improve your score."}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 mb-5 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-gray-600 mr-1">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-green-100 border border-green-400 inline-block" />
              Correct (your answer)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-red-100 border border-red-400 inline-block" />
              Wrong (your answer)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-green-50 border border-green-300 inline-block" />
              Correct answer (not chosen)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-gray-50 border border-gray-200 inline-block" />
              Other option
            </span>
            <button
              onClick={() => setShowLegend(false)}
              className="ml-auto text-gray-400 hover:text-gray-600 text-base"
            >
              ✕
            </button>
          </div>
        )}

        {/* Part tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {sortedParts.map((part, idx) => {
            const ps = getPartScore(part);
            return (
              <button
                key={part.id}
                onClick={() => setActivePart(idx)}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
                  activePart === idx
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-blue-400"
                }`}
              >
                Part {part.part_number}
                <span className={`ml-2 text-xs ${activePart === idx ? "text-blue-200" : "text-gray-400"}`}>
                  {ps.correct}/{ps.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Part header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentPart.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {currentPartScore.correct} correct out of {currentPartScore.total} questions
                {" · "}
                {currentPartScore.total > 0
                  ? Math.round((currentPartScore.correct / currentPartScore.total) * 100)
                  : 0}%
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
            // Part 1: direct questions — numbered 1, 2, 3…
            [...(currentPart.questions || [])]
              .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
              .map((q, qi) => (
                <QuestionReview
                  key={q.id}
                  question={q}
                  selectedOptionId={answers[q.id]}
                  globalNumber={qi + 1}
                />
              ))
          ) : (
            // Part 2 & 3: passages — counter resets to 1 for this part
            (() => {
              let counter = 0;
              return [...(currentPart.passages || [])]
                .sort((a, b) => (a.passage_order || 0) - (b.passage_order || 0))
                .map((passage) => {
                  const passageQs = [...(passage.questions || [])].sort(
                    (a, b) => (a.question_number || 0) - (b.question_number || 0)
                  );
                  return (
                    <div key={passage.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Passage header */}
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900">{passage.title || `Passage ${passage.passage_order}`}</h3>
                        {passage.audio_url && (
                          <audio controls src={passage.audio_url} className="mt-2 w-full h-9" />
                        )}
                        {passage.script && (
                          <ScriptBlock script={passage.script} label="Conversation / Lecture Script" />
                        )}
                      </div>

                      {/* Passage questions */}
                      <div className="p-5 space-y-5">
                        {passageQs.map((q) => {
                          counter++;
                          return (
                            <QuestionReview
                              key={q.id}
                              question={q}
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

          {/* Empty state */}
          {(currentPart.questions || []).length === 0 && (currentPart.passages || []).length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-800 text-sm">
              No questions available for this part.
            </div>
          )}
        </div>

        {/* Part navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setActivePart((p) => Math.max(0, p - 1))}
            disabled={activePart === 0}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm disabled:opacity-40"
          >
            ← Previous Part
          </button>
          {activePart < exam.parts.length - 1 ? (
            <button
              onClick={() => setActivePart((p) => p + 1)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Next Part →
            </button>
          ) : (
            <Link
              href={`/test/${examId}`}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
            >
              Retake Test
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
