"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Test | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch exam
        const examResponse = await testsApi.getById(examId);
        if (examResponse.success && examResponse.data) {
          setExam(examResponse.data);

          // Fetch parts
          const partsResponse = await testsApi.getParts(examId);
          if (partsResponse.success && partsResponse.data) {
            setParts(partsResponse.data);
          }
        } else {
          setError("Exam not found");
          router.push("/admin");
        }
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load exam");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || "Exam not found"}</p>
          <Link href="/admin" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completedSteps = {
    created: true,
    partsAdded: parts.length === 3,
    passagesAdded: parts.some(p => p.passages && p.passages.length > 0),
    questionsAdded: parts.some(p => p.questions && p.questions.length > 0),
    optionsAdded: parts.some(p =>
      p.questions?.some(q => q.options && q.options.length === 4)
    ),
  };

  const nextStep = !completedSteps.partsAdded ? "parts" : 
                   !completedSteps.passagesAdded ? "passages" : 
                   !completedSteps.questionsAdded ? "questions" : 
                   !completedSteps.optionsAdded ? "options" : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{exam.title}</h1>
              <p className="text-gray-600">{exam.description}</p>
              <div className="flex gap-6 mt-3 text-sm text-gray-600">
                <span>📊 Level: <strong>{exam.level}</strong></span>
                <span>⏱️ Duration: <strong>{exam.total_duration || exam.duration || 0} min</strong></span>
                <span>🆔 ID: <strong>{exam.id}</strong></span>
              </div>
            </div>
            <Link href={`/admin/exams/${exam.id}/add-part`}>
              <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition">
                ⚙️ Edit Parts
              </button>
            </Link>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Progress</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-4 rounded-lg ${completedSteps.created ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-gray-300"}`}>
              <div className="text-2xl mb-2">{completedSteps.created ? "✅" : "📝"}</div>
              <h3 className="font-semibold text-gray-900">Exam Created</h3>
              <p className="text-sm text-gray-600">Basic info</p>
            </div>

            <div className={`p-4 rounded-lg ${completedSteps.partsAdded ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-gray-300"}`}>
              <div className="text-2xl mb-2">{completedSteps.partsAdded ? "✅" : "📋"}</div>
              <h3 className="font-semibold text-gray-900">Parts Added</h3>
              <p className="text-sm text-gray-600">{parts.length}/3</p>
            </div>

            <div className={`p-4 rounded-lg ${completedSteps.passagesAdded ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-gray-300"}`}>
              <div className="text-2xl mb-2">{completedSteps.passagesAdded ? "✅" : "📖"}</div>
              <h3 className="font-semibold text-gray-900">Passages Added</h3>
              <p className="text-sm text-gray-600">{parts.reduce((acc, p) => acc + (p.passages?.length || 0), 0)}</p>
            </div>

            <div className={`p-4 rounded-lg ${completedSteps.questionsAdded ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-gray-300"}`}>
              <div className="text-2xl mb-2">{completedSteps.questionsAdded ? "✅" : "❓"}</div>
              <h3 className="font-semibold text-gray-900">Questions Added</h3>
              <p className="text-sm text-gray-600">{parts.reduce((acc, p) => acc + (p.questions?.length || 0), 0)}</p>
            </div>

            <div className={`p-4 rounded-lg ${completedSteps.optionsAdded ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-gray-300"}`}>
              <div className="text-2xl mb-2">{completedSteps.optionsAdded ? "✅" : "🔘"}</div>
              <h3 className="font-semibold text-gray-900">Options Added</h3>
              <p className="text-sm text-gray-600">A, B, C, D</p>
            </div>

            <div className={`p-4 rounded-lg ${nextStep === null ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-gray-300"}`}>
              <div className="text-2xl mb-2">{nextStep === null ? "✅" : "📚"}</div>
              <h3 className="font-semibold text-gray-900">Complete</h3>
              <p className="text-sm text-gray-600">{nextStep === null ? "Ready!" : "In progress"}</p>
            </div>
          </div>

          {/* Next Step Recommendation */}
          {nextStep && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📌 Next Step Recommended</h3>
              {nextStep === "parts" && <p className="text-blue-800 mb-3">Add 3 parts (Part 1, 2, 3) with their audio URLs.</p>}
              {nextStep === "passages" && <p className="text-blue-800 mb-3">Add passages for Part 2 and Part 3 (3 passages each).</p>}
              {nextStep === "questions" && <p className="text-blue-800 mb-3">Add questions to each part (8 / 12 / 15).</p>}
              {nextStep === "options" && <p className="text-blue-800 mb-3">Add answer options (A, B, C, D) for each question.</p>}
              <Link href={`/admin/exams/${exam.id}/add-${nextStep === "options" ? "options" : nextStep === "questions" ? "questions" : nextStep === "passages" ? "passages" : "part"}`}>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                  Continue →
                </button>
              </Link>
            </div>
          )}

          {nextStep === null && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">🎉 Exam Complete!</h3>
              <p className="text-green-800">All parts have been configured with passages, questions, and options.</p>
            </div>
          )}
        </div>

        {/* Parts Details */}
        {parts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Parts Overview</h2>

            <div className="space-y-4">
              {parts.map((part) => (
                <div key={part.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Part {part.part_number}</h3>
                      <p className="text-gray-600 text-sm mb-2">{part.title}</p>
                      <div className="flex gap-4 text-sm">
                        <span className={part.passages && part.passages.length > 0 ? "text-green-700" : "text-gray-500"}>
                          📖 Passages: {part.passages?.length || 0}
                        </span>
                        <span className={part.questions && part.questions.length > 0 ? "text-green-700" : "text-gray-500"}>
                          ❓ Questions: {part.questions?.length || 0}
                        </span>
                        <span className="text-gray-500">
                          🔊 Audio: {part.audio_url ? "✓" : "✗"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {part.part_number >= 2 && (
                        <Link href={`/admin/exams/${exam.id}/add-passages`}>
                          <button className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-900 rounded transition">
                            Passages
                          </button>
                        </Link>
                      )}
                      <Link href={`/admin/exams/${exam.id}/add-questions`}>
                        <button className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-900 rounded transition">
                          Questions
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {parts.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {!completedSteps.partsAdded && (
                <Link href={`/admin/exams/${exam.id}/add-part`}>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                    + Add More Parts
                  </button>
                </Link>
              )}
              {completedSteps.partsAdded && !completedSteps.passagesAdded && (
                <Link href={`/admin/exams/${exam.id}/add-passages`}>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                    + Add Passages
                  </button>
                </Link>
              )}
              {completedSteps.passagesAdded && !completedSteps.questionsAdded && (
                <Link href={`/admin/exams/${exam.id}/add-questions`}>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                    + Add Questions
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
