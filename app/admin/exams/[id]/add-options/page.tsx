"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";

interface OptionForm {
  id?: string;
  content: string;
  option_label?: string;
  is_correct: boolean;
}

interface QuestionWithOptions {
  id: string;
  content: string;
  options: OptionForm[];
  passage_id?: string;
}

export default function AddOptionsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Test | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [questionsWithOptions, setQuestionsWithOptions] = useState<Record<string, QuestionWithOptions[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

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
            if (partsResponse.data.length > 0) {
              setSelectedPart(partsResponse.data[0].id);
            }

            // Initialize questions with options
            const questionsMap: Record<string, QuestionWithOptions[]> = {};
            (partsResponse.data || []).forEach((part: any) => {
              if (part.questions && part.questions.length > 0) {
                questionsMap[part.id] = part.questions.map((q: any) => ({
                  id: q.id,
                  content: q.content,
                  passage_id: q.passage_id,
                  options: (q.options && q.options.length > 0)
                    ? q.options.map((opt: any) => ({
                        id: opt.id,
                        content: opt.content,
                        option_label: opt.option_label,
                        is_correct: opt.is_correct,
                      }))
                    : [
                        { content: "", option_label: "A", is_correct: false },
                        { content: "", option_label: "B", is_correct: false },
                        { content: "", option_label: "C", is_correct: false },
                        { content: "", option_label: "D", is_correct: false },
                      ],
                }));
              } else {
                questionsMap[part.id] = [];
              }
            });
            setQuestionsWithOptions(questionsMap);
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

  const handleOptionChange = (
    partId: string,
    questionIndex: number,
    optionIndex: number,
    field: keyof OptionForm,
    value: string | boolean
  ) => {
    setQuestionsWithOptions((prev) => ({
      ...prev,
      [partId]: prev[partId].map((q, qi) =>
        qi === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, oi) =>
                oi === optionIndex ? { ...opt, [field]: value } : opt
              ),
            }
          : q
      ),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Validate & save options for each question
      for (const partId in questionsWithOptions) {
        const questionsList = questionsWithOptions[partId];
        for (const question of questionsList) {
          // Validate: all options must have text
          if (question.options.some((opt) => !opt.content.trim())) {
            setError("All options must have text");
            setIsSaving(false);
            return;
          }

          // Validate: exactly one correct answer
          const correctCount = question.options.filter((opt) => opt.is_correct).length;
          if (correctCount !== 1) {
            setError(`Question "${question.content.substring(0, 50)}..." must have exactly 1 correct answer`);
            setIsSaving(false);
            return;
          }

          // Save each option
          for (let i = 0; i < question.options.length; i++) {
            const option = question.options[i];
            const optionLabel = String.fromCharCode(65 + i); // A, B, C, D

            if (option.id) {
              // Update existing
              await testsApi.updateOption(examId, question.id, option.id, {
                content: option.content,
                option_label: optionLabel,
                is_correct: option.is_correct,
              });
            } else {
              // Create new
              await testsApi.createOption(examId, question.id, {
                content: option.content,
                option_label: optionLabel,
                is_correct: option.is_correct,
              });
            }
          }
        }
      }

      router.push(`/admin/exams/${examId}`);
    } catch (err: any) {
      setError(err.message || "Failed to save options");
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Questions Available</h1>
            <p className="text-gray-600 mb-6">You need to add questions first before adding options.</p>
            <Link href={`/admin/exams/${examId}/add-questions`}>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Add Questions
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentPart = parts.find((p) => p.id === selectedPart);
  const currentQuestions = currentPart ? questionsWithOptions[currentPart.id] || [] : [];
  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/admin/exams/${examId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Exam
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Answer Options</h1>
          <p className="text-gray-600">Step 5 of 6: Add A, B, C, D options for each question</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className={`flex-1 h-2 rounded-full ${step <= 5 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            ))}
          </div>
          <p className="text-sm text-gray-600">Step 5: Add Answer Options</p>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Sidebar - Part Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-32">
              <h3 className="font-bold text-gray-900 mb-4">Parts</h3>
              <div className="space-y-2">
                {parts.map((part) => {
                  const partQuestions = questionsWithOptions[part.id] || [];
                  const completeQuestions = partQuestions.filter((q) =>
                    q.options.every((opt) => opt.content.trim()) &&
                    q.options.some((opt) => opt.is_correct)
                  ).length;

                  return (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition ${
                        selectedPart === part.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      <div className="font-semibold">Part {part.part_number}</div>
                      <div className="text-xs opacity-80">
                        {completeQuestions}/{partQuestions.length} ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Options Editor */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSave} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {error}
                </div>
              )}

              {currentPart && currentQuestions.length > 0 && (
                <div className="space-y-6">
                  {currentQuestions.map((question, questionIndex) => (
                    <div key={question.id} className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                        Question {questionIndex + 1}: {question.content}
                      </h3>

                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            {/* Option Letter */}
                            <span className="inline-block w-8 h-8 bg-blue-100 text-blue-900 rounded-full text-center text-sm font-bold pt-1.5">
                              {optionLetters[optionIndex]}
                            </span>

                            {/* Option Content */}
                            <textarea
                              value={option.content}
                              onChange={(e) =>
                                handleOptionChange(
                                  currentPart.id,
                                  questionIndex,
                                  optionIndex,
                                  "content",
                                  e.target.value
                                )
                              }
                              placeholder={`Enter option ${optionLetters[optionIndex]}`}
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                            />

                            {/* Correct Answer Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                // Set this as correct, unset others
                                handleOptionChange(
                                  currentPart.id,
                                  questionIndex,
                                  optionIndex,
                                  "is_correct",
                                  !option.is_correct
                                );
                                // Unset other correct answers
                                if (!option.is_correct) {
                                  question.options.forEach((_, i) => {
                                    if (i !== optionIndex && question.options[i].is_correct) {
                                      handleOptionChange(
                                        currentPart.id,
                                        questionIndex,
                                        i,
                                        "is_correct",
                                        false
                                      );
                                    }
                                  });
                                }
                              }}
                              className={`px-3 py-2 rounded-lg font-semibold transition ${
                                option.is_correct
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                              }`}
                            >
                              {option.is_correct ? "✓ Correct" : "Correct?"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Validation */}
                      <div className="mt-4 text-xs">
                        {question.options.every((opt) => opt.content.trim()) ? (
                          <span className="text-green-700">✓ All options complete</span>
                        ) : (
                          <span className="text-orange-700">⚠️ Some options are empty</span>
                        )}
                        {question.options.filter((opt) => opt.is_correct).length === 1 ? (
                          <span className="text-green-700 ml-3">✓ Has correct answer</span>
                        ) : (
                          <span className="text-red-700 ml-3">✗ Must have 1 correct answer</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentPart && currentQuestions.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-4">No questions in this part yet</p>
                  <Link href={`/admin/exams/${examId}/add-questions`}>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add Questions First
                    </button>
                  </Link>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 bg-white rounded-lg shadow-lg p-8">
                <Link href={`/admin/exams/${examId}`} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                >
                  {isSaving ? "Saving..." : "Save Options & Finish"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 About Answer Options</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Each question must have exactly 4 options (A, B, C, D)</li>
            <li>All 4 options must have text</li>
            <li>Exactly one option must be marked as the correct answer</li>
            <li>Click the <strong>Correct?</strong> button to mark an option as correct</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
