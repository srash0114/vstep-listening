"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { testsApi } from "@/lib/api";
import FormInput from "@/components/FormInput";
import Alert from "@/components/Alert";

const DRAFT_STORAGE_KEY = "question_draft";
const DRAFTS_LIST_KEY = "questions_drafts_list";

interface Question {
  questionNumber: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  correctAnswerIndex: number;
  script: string;
}

interface QuestionDraft {
  id: string;
  testId: string;
  partId: string;
  questions: Question[];
  createdAt: string;
}

interface Test {
  id: number;
  title: string;
}

interface Part {
  id: number;
  partNumber: number;
  title: string;
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [testId, setTestId] = useState("");
  const [partId, setPartId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionNumber: 1,
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      correctAnswerIndex: 0,
      script: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // ==================== Initialization ====================
  useEffect(() => {
    loadTests();
    loadDrafts();
  }, []);

  useEffect(() => {
    if (testId) {
      loadParts();
    }
  }, [testId]);

  const loadTests = async () => {
    try {
      const response = await testsApi.getAll();
      if (response.data) {
        setTests(response.data);
      }
    } catch (error) {
      console.error("Failed to load tests:", error);
      setAlert({ type: "error", message: "Failed to load tests" });
    }
  };

  const loadParts = async () => {
    try {
      const response = await testsApi.getParts(parseInt(testId));
      if (response.data) {
        setParts(response.data);
        setPartId(""); // Reset part selection when test changes
      }
    } catch (error) {
      console.error("Failed to load parts:", error);
      setAlert({ type: "error", message: "Failed to load parts" });
    }
  };

  // ==================== Draft Management ====================
  const loadDrafts = () => {
    if (typeof window === "undefined") return;
    try {
      const save = localStorage.getItem(DRAFTS_LIST_KEY);
      if (save) setDrafts(JSON.parse(save));
    } catch (error) {
      console.error("Failed to load drafts:", error);
    }
  };

  const saveDraft = () => {
    if (!testId || !partId) {
      setAlert({ type: "error", message: "Test and Part must be selected" });
      return;
    }

    if (questions.some((q) => !q.question.trim())) {
      setAlert({ type: "error", message: "All questions must have text" });
      return;
    }

    if (typeof window === "undefined") return;

    const draftId = Date.now().toString();
    const newDraft: QuestionDraft = {
      id: draftId,
      testId,
      partId,
      questions,
      createdAt: new Date().toLocaleString(),
    };

    const updatedDrafts = [...drafts, newDraft];
    localStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setAlert({ type: "success", message: "Draft saved successfully!" });
  };

  const loadDraft = (draft: QuestionDraft) => {
    setTestId(draft.testId);
    setPartId(draft.partId);
    setQuestions(draft.questions);
    setShowDrafts(false);
    setAlert({ type: "success", message: "Draft loaded!" });
  };

  const deleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter((d) => d.id !== id);
    localStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setAlert({ type: "success", message: "Draft deleted!" });
  };

  // ==================== Question Management ====================
  const addQuestion = () => {
    const newQuestion: Question = {
      questionNumber: questions.length + 1,
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      correctAnswerIndex: 0,
      script: "",
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    const answerMap: Record<string, number> = { "": 0, A: 0, B: 1, C: 2, D: 3 };
    updated[index] = {
      ...updated[index],
      [field]: value,
      ...(field === "correctAnswer" && {
        correctAnswerIndex: answerMap[value as string] || 0,
      }),
    };
    setQuestions(updated);
  };

  // ==================== Form Validation ====================
  const validateForm = (): boolean => {
    if (!testId) {
      setAlert({ type: "error", message: "Test is required" });
      return false;
    }
    if (!partId) {
      setAlert({ type: "error", message: "Part is required" });
      return false;
    }
    if (questions.length === 0) {
      setAlert({ type: "error", message: "Add at least one question" });
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setAlert({ type: "error", message: `Question ${i + 1} text is required` });
        return false;
      }
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        setAlert({ type: "error", message: `Question ${i + 1} must have all 4 options` });
        return false;
      }
      if (!q.correctAnswer) {
        setAlert({ type: "error", message: `Question ${i + 1} must have correct answer selected` });
        return false;
      }
    }
    return true;
  };

  // ==================== Submit ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await testsApi.createQuestionsBatch(
        parseInt(testId),
        parseInt(partId),
        questions
      );

      if (response.success) {
        setAlert({
          type: "success",
          message: `${questions.length} questions created successfully!`,
        });

        // Reset form
        setTimeout(() => {
          setTestId("");
          setPartId("");
          setQuestions([
            {
              questionNumber: 1,
              question: "",
              optionA: "",
              optionB: "",
              optionC: "",
              optionD: "",
              correctAnswer: "",
              correctAnswerIndex: 0,
              script: "",
            },
          ]);
        }, 1500);
      } else {
        setAlert({
          type: "error",
          message: response.message || "Failed to create questions",
        });
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setAlert({
        type: "error",
        message: error.message || "Failed to create questions",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Batch Questions</h1>
          <p className="text-gray-600 mb-8">Create multiple questions for a specific test part</p>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Test & Part Selection */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Test & Part</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Test *</label>
                  <select
                    value={testId}
                    onChange={(e) => setTestId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select a test --</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id.toString()}>
                        {test.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Part *</label>
                  <select
                    value={partId}
                    onChange={(e) => setPartId(e.target.value)}
                    disabled={!testId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  >
                    <option value="">-- Select a part --</option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id.toString()}>
                        Part {part.partNumber}: {part.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Questions ({questions.length})</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((question, qIndex) => (
                  <div key={qIndex} className="border rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-900">Question {qIndex + 1}</h3>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Question Text */}
                    <FormInput
                      label="Question Text"
                      name={`question_${qIndex}`}
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      placeholder="What is the main idea?"
                      required
                    />

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormInput
                        label="Option A"
                        name={`optionA_${qIndex}`}
                        value={question.optionA}
                        onChange={(e) => updateQuestion(qIndex, "optionA", e.target.value)}
                        required
                      />
                      <FormInput
                        label="Option B"
                        name={`optionB_${qIndex}`}
                        value={question.optionB}
                        onChange={(e) => updateQuestion(qIndex, "optionB", e.target.value)}
                        required
                      />
                      <FormInput
                        label="Option C"
                        name={`optionC_${qIndex}`}
                        value={question.optionC}
                        onChange={(e) => updateQuestion(qIndex, "optionC", e.target.value)}
                        required
                      />
                      <FormInput
                        label="Option D"
                        name={`optionD_${qIndex}`}
                        value={question.optionD}
                        onChange={(e) => updateQuestion(qIndex, "optionD", e.target.value)}
                        required
                      />
                    </div>

                    {/* Correct Answer & Script */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                        <select
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select answer</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <FormInput
                        label="Script/Transcript (optional)"
                        name={`script_${qIndex}`}
                        value={question.script}
                        onChange={(e) => updateQuestion(qIndex, "script", e.target.value)}
                        placeholder="Full transcript of audio"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading || !testId || !partId}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
              >
                {loading ? "Creating Questions..." : `Create ${questions.length} Questions`}
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={!testId || !partId}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition font-medium"
              >
                💾 Save Draft
              </button>
              <button
                type="button"
                onClick={() => setShowDrafts(!showDrafts)}
                className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium"
              >
                📋 Drafts ({drafts.length})
              </button>
            </div>
          </form>

          {/* Drafts Section */}
          {showDrafts && (
            <div className="mt-12 border-t border-gray-300 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Saved Drafts</h2>

              {drafts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No drafts saved yet</p>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {questions.length} Questions • Part {draft.partId}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Test ID: {draft.testId} • Created: {draft.createdAt}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadDraft(draft)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
