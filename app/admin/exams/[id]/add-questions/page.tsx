"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";

interface QuestionForm {
  id?: string;
  content: string;
  passage_id?: string;
  difficulty_level?: string;
  script?: string;
  audio_url?: string;
  order_index?: number;
  part_id: string;
}

export default function AddQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Test | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [questions, setQuestions] = useState<Record<string, QuestionForm[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examResponse = await testsApi.getById(examId);
        if (examResponse.success && examResponse.data) {
          setExam(examResponse.data);

          const partsResponse = await testsApi.getParts(examId);
          if (partsResponse.success && partsResponse.data) {
            setParts(partsResponse.data);
            if (partsResponse.data.length > 0) {
              setSelectedPart(partsResponse.data[0].id);
            }

            const questionsMap: Record<string, QuestionForm[]> = {};
            (partsResponse.data || []).forEach((part: any) => {
              // Collect questions from direct part questions and from passages
              const allQuestions: QuestionForm[] = [];

              if (part.questions && part.questions.length > 0) {
                part.questions.forEach((q: any) => {
                  allQuestions.push({
                    id: q.id,
                    content: q.content || q.text || "",
                    passage_id: q.passage_id ? String(q.passage_id) : undefined,
                    difficulty_level: q.difficulty_level,
                    script: q.script,
                    audio_url: q.audio_url,
                    order_index: q.order_index,
                    part_id: part.id,
                  });
                });
              }

              if (part.passages && part.passages.length > 0) {
                part.passages.forEach((passage: any) => {
                  if (passage.questions && passage.questions.length > 0) {
                    passage.questions.forEach((q: any) => {
                      allQuestions.push({
                        id: q.id,
                        content: q.content || q.text || "",
                        passage_id: String(passage.id),
                        difficulty_level: q.difficulty_level,
                        script: q.script,
                        audio_url: q.audio_url,
                        order_index: q.order_index,
                        part_id: part.id,
                      });
                    });
                  }
                });
              }

              questionsMap[part.id] = allQuestions;
            });
            setQuestions(questionsMap);
          }
        }
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const handleQuestionChange = (partId: string, index: number, field: keyof QuestionForm, value: string) => {
    setQuestions((prev) => ({
      ...prev,
      [partId]: prev[partId].map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  const addQuestion = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    const firstPassageId =
      part && (part as any).passages?.length > 0 ? String((part as any).passages[0].id) : undefined;
    setQuestions((prev) => ({
      ...prev,
      [partId]: [
        ...prev[partId],
        { content: "", part_id: partId, passage_id: firstPassageId },
      ],
    }));
  };

  const removeQuestion = (partId: string, index: number) => {
    const question = questions[partId]?.[index];
    if (question?.id) {
      setDeletedQuestionIds((prev) => [...prev, question.id!]);
    }
    setQuestions((prev) => ({
      ...prev,
      [partId]: prev[partId].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      // Delete questions that were removed from the form
      for (const questionId of deletedQuestionIds) {
        await testsApi.deleteQuestion(examId, questionId);
      }

      for (const partId in questions) {
        const questionsList = questions[partId];
        for (let i = 0; i < questionsList.length; i++) {
          const question = questionsList[i];
          if (!question.content.trim()) continue;

          if (question.id) {
            await testsApi.updateQuestion(examId, question.id, {
              content: question.content,
              difficulty_level: question.difficulty_level,
              script: question.script,
              audio_url: question.audio_url,
            });
          } else {
            const part = parts.find((p) => p.id === partId);
            const partNum = (part as any)?.part_number || 1;
            const baseOffset = partNum === 1 ? 0 : partNum === 2 ? 8 : 20;
            const questionNumber = baseOffset + i + 1;

            await testsApi.createQuestion(examId, partId, {
              part_id: parseInt(partId),
              passage_id: question.passage_id ? parseInt(question.passage_id) : undefined,
              content: question.content,
              difficulty_level: question.difficulty_level || "3",
              script: question.script,
              audio_url: question.audio_url,
              order_index: i + 1,
              question_number: questionNumber,
            });
          }
        }
      }

      setSuccess("Questions saved!");
      setTimeout(() => router.push(`/admin/exams/${examId}`), 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save questions");
    } finally {
      setIsSaving(false);
    }
  };

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

  if (!exam || parts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href={`/admin/exams/${examId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Exam
          </Link>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Parts Available</h1>
            <p className="text-gray-600 mb-6">Add parts first before adding questions.</p>
            <Link href={`/admin/exams/${examId}/add-part`}>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Add Parts
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentPart = parts.find((p) => p.id === selectedPart);
  const currentPartPassages = currentPart ? (currentPart as any).passages || [] : [];
  const needsPassage = currentPart && (currentPart as any).part_number >= 2;

  const expectedCount = currentPart
    ? (currentPart as any).part_number === 1 ? 8 : (currentPart as any).part_number === 2 ? 12 : 15
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/admin/exams/${examId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
            ← Back to Exam
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Add Questions</h1>
          <p className="text-gray-500">Step 4 of 5: Add questions for each part</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`flex-1 h-2 rounded-full ${s <= 4 ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-5 sticky top-28">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Parts</h3>
              <div className="space-y-2">
                {parts.map((part) => {
                  const count = questions[part.id]?.length || 0;
                  const expected = (part as any).part_number === 1 ? 8 : (part as any).part_number === 2 ? 12 : 15;
                  return (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm ${
                        selectedPart === part.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      <div className="font-semibold">Part {(part as any).part_number}</div>
                      <div className={`text-xs mt-0.5 ${selectedPart === part.id ? "text-blue-100" : "text-gray-500"}`}>
                        {count}/{expected} questions
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
              )}

              {currentPart && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold text-gray-900">Part {(currentPart as any).part_number}</h2>
                    <span className="text-xs text-gray-400">
                      {questions[currentPart.id]?.length || 0} / {expectedCount} questions
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-5">{currentPart.title}</p>

                  {needsPassage && currentPartPassages.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4 text-sm text-yellow-800">
                      ⚠️ This part needs passages first. <Link href={`/admin/exams/${examId}/add-passages`} className="underline font-semibold">Add passages →</Link>
                    </div>
                  )}

                  <div className="space-y-4">
                    {(questions[currentPart.id] || []).map((question, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-gray-800 text-sm">Question {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeQuestion(currentPart.id, index)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-3">
                          {/* Passage selector for Part 2 & 3 */}
                          {needsPassage && currentPartPassages.length > 0 && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Passage *
                              </label>
                              <select
                                value={question.passage_id || ""}
                                onChange={(e) => handleQuestionChange(currentPart.id, index, "passage_id", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                required
                              >
                                <option value="">-- Select passage --</option>
                                {currentPartPassages.map((p: any) => (
                                  <option key={p.id} value={String(p.id)}>
                                    {p.title || `Passage ${p.passage_order || p.id}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Question *</label>
                            <textarea
                              value={question.content}
                              onChange={(e) => handleQuestionChange(currentPart.id, index, "content", e.target.value)}
                              placeholder="What is the main topic of the passage?"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty</label>
                              <select
                                value={question.difficulty_level || "3"}
                                onChange={(e) => handleQuestionChange(currentPart.id, index, "difficulty_level", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                              >
                                <option value="3-">3- (Easy)</option>
                                <option value="3">3 (Medium)</option>
                                <option value="4">4 (Hard)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Audio URL (optional)</label>
                              <input
                                type="url"
                                value={question.audio_url || ""}
                                onChange={(e) => handleQuestionChange(currentPart.id, index, "audio_url", e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Script (optional)</label>
                            <textarea
                              value={question.script || ""}
                              onChange={(e) => handleQuestionChange(currentPart.id, index, "script", e.target.value)}
                              placeholder="Transcript relevant to this question..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addQuestion(currentPart.id)}
                    className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg text-gray-500 hover:text-blue-600 transition text-sm font-medium"
                  >
                    + Add Question
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 bg-white rounded-xl shadow-md p-5">
                <Link href={`/admin/exams/${examId}`}>
                  <button type="button" className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition text-sm"
                >
                  {isSaving ? "Saving..." : "Save Questions & Continue →"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
          <strong>Targets:</strong> Part 1 → 8 questions · Part 2 → 12 questions (3 passages × 4) · Part 3 → 15 questions (3 passages × 5).
          Questions without content will be skipped.
        </div>
      </div>
    </div>
  );
}
