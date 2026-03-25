"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { testsApi } from "@/lib/api";
import FormInput from "@/components/FormInput";
import Alert from "@/components/Alert";

interface Part {
  partNumber: number;
  title: string;
  description: string;
  audioFile: File | null;
  audioFileName: string;
  questions: Question[];
}

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

const VSTEP_STRUCTURE = {
  1: {
    title: "Announcements & Short Messages",
    description: "Listen to 8 short announcements/messages",
    questionCount: 8,
  },
  2: {
    title: "Long Conversations",
    description: "Listen to 3 conversations with 4 questions each",
    questionCount: 12,
  },
  3: {
    title: "Lectures & Talks",
    description: "Listen to 3 academic lectures with 5 questions each",
    questionCount: 15,
  },
};

export default function CreateCompleteTestPage() {
  const router = useRouter();
  const [testInfo, setTestInfo] = useState({
    title: "VSTEP Listening Test",
    level: "B1",
    duration: "3600",
  });

  const [parts, setParts] = useState<Part[]>(
    [1, 2, 3].map((num) => ({
      partNumber: num,
      title: (VSTEP_STRUCTURE as any)[num].title,
      description: (VSTEP_STRUCTURE as any)[num].description,
      audioFile: null,
      audioFileName: "",
      questions: [],
    }))
  );

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [currentPart, setCurrentPart] = useState(1);

  const handleTestInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTestInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAudioChange = (partNumber: number, file: File | null) => {
    setParts((prev) =>
      prev.map((part) =>
        part.partNumber === partNumber
          ? {
              ...part,
              audioFile: file,
              audioFileName: file?.name || "",
            }
          : part
      )
    );
  };

  const addQuestion = (partNumber: number) => {
    setParts((prev) =>
      prev.map((part) => {
        if (part.partNumber === partNumber) {
          const questionCount = part.questions.length + 1;
          return {
            ...part,
            questions: [
              ...part.questions,
              {
                questionNumber: questionCount,
                question: "",
                optionA: "",
                optionB: "",
                optionC: "",
                optionD: "",
                correctAnswer: "",
                correctAnswerIndex: 0,
                script: "",
              },
            ],
          };
        }
        return part;
      })
    );
  };

  const updateQuestion = (
    partNumber: number,
    questionIndex: number,
    field: keyof Question,
    value: any
  ) => {
    setParts((prev) =>
      prev.map((part) => {
        if (part.partNumber === partNumber) {
          const updatedQuestions = [...part.questions];
          updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            [field]: value,
            ...(field === "correctAnswer" && {
              correctAnswerIndex: { A: 0, B: 1, C: 2, D: 3 }[value as string] || 0,
            }),
          };
          return { ...part, questions: updatedQuestions };
        }
        return part;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!testInfo.title.trim()) {
      setAlert({ type: "error", message: "Test title is required" });
      return;
    }

    for (const part of parts) {
      if (!part.audioFile) {
        setAlert({ type: "error", message: `Audio file for Part ${part.partNumber} is required` });
        return;
      }
      if (part.questions.length === 0) {
        setAlert({ type: "error", message: `Part ${part.partNumber} requires at least 1 question` });
        return;
      }
      for (const question of part.questions) {
        if (!question.question.trim()) {
          setAlert({ type: "error", message: `Question text is required for Part ${part.partNumber}` });
          return;
        }
        if (!question.optionA.trim() || !question.optionB.trim() || !question.optionC.trim() || !question.optionD.trim()) {
          setAlert({ type: "error", message: `All options are required for Part ${part.partNumber}` });
          return;
        }
        if (!question.correctAnswer) {
          setAlert({ type: "error", message: `Correct answer must be selected for Part ${part.partNumber}` });
          return;
        }
      }
    }

    try {
      setLoading(true);

      const requestData = {
        title: testInfo.title,
        level: testInfo.level,
        duration: parseInt(testInfo.duration),
        parts: parts.map((part) => ({
          partNumber: part.partNumber,
          title: part.title,
          description: part.description,
          questions: part.questions,
        })),
      };

      const audioFiles = parts.map((part) => part.audioFile as File);

      const response = await testsApi.createComplete(requestData, audioFiles);

      if (response.success) {
        setAlert({
          type: "success",
          message: `Test created successfully! Test ID: ${response.data.testId}`,
        });

        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else {
        setAlert({
          type: "error",
          message: response.message || "Failed to create test",
        });
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setAlert({
        type: "error",
        message: error.message || "Failed to create test",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPartData = parts.find((p) => p.partNumber === currentPart);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Complete VSTEP Test</h1>
          <p className="text-gray-600 mb-8">Create a test with all parts, audio files, and questions</p>

          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Test Info */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Test Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Test Title"
                  name="testTitle"
                  value={testInfo.title}
                  onChange={handleTestInfoChange}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    name="level"
                    value={testInfo.level}
                    onChange={handleTestInfoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A1">A1 (Elementary)</option>
                    <option value="A2">A2 (Elementary)</option>
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper Intermediate)</option>
                    <option value="C1">C1 (Advanced)</option>
                    <option value="C2">C2 (Proficiency)</option>
                  </select>
                </div>
                <FormInput
                  label="Duration (seconds)"
                  name="testDuration"
                  type="number"
                  value={testInfo.duration}
                  onChange={handleTestInfoChange}
                  required
                />
              </div>
            </div>

            {/* Parts Navigation */}
            <div className="flex gap-2 mb-6">
              {parts.map((part) => (
                <button
                  key={part.partNumber}
                  type="button"
                  onClick={() => setCurrentPart(part.partNumber)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPart === part.partNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Part {part.partNumber}
                </button>
              ))}
            </div>

            {/* Current Part */}
            {currentPartData && (
              <div className="border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Part {currentPartData.partNumber}: {currentPartData.title}
                </h2>
                <p className="text-gray-600 mb-4">{currentPartData.description}</p>

                {/* Audio Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio File (mp3, wav, ogg, webm) - Max 10MB *
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleAudioChange(currentPartData.partNumber, e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  {currentPartData.audioFileName && (
                    <p className="text-sm text-green-600 mt-1">✓ {currentPartData.audioFileName}</p>
                  )}
                </div>

                {/* Questions */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Questions</h3>
                    <button
                      type="button"
                      onClick={() => addQuestion(currentPartData.partNumber)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      + Add Question
                    </button>
                  </div>

                  {currentPartData.questions.length > 0 ? (
                    <div className="space-y-6">
                      {currentPartData.questions.map((question, qIndex) => (
                        <div key={qIndex} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-900">Question {question.questionNumber}</h4>
                          </div>

                          <FormInput
                            label="Question Text"
                            name={`q_${qIndex}`}
                            value={question.question}
                            onChange={(e) =>
                              updateQuestion(currentPartData.partNumber, qIndex, "question", e.target.value)
                            }
                            placeholder="What is the main idea?"
                            required
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormInput
                              label="Option A"
                              name={`optA_${qIndex}`}
                              value={question.optionA}
                              onChange={(e) =>
                                updateQuestion(currentPartData.partNumber, qIndex, "optionA", e.target.value)
                              }
                              required
                            />
                            <FormInput
                              label="Option B"
                              name={`optB_${qIndex}`}
                              value={question.optionB}
                              onChange={(e) =>
                                updateQuestion(currentPartData.partNumber, qIndex, "optionB", e.target.value)
                              }
                              required
                            />
                            <FormInput
                              label="Option C"
                              name={`optC_${qIndex}`}
                              value={question.optionC}
                              onChange={(e) =>
                                updateQuestion(currentPartData.partNumber, qIndex, "optionC", e.target.value)
                              }
                              required
                            />
                            <FormInput
                              label="Option D"
                              name={`optD_${qIndex}`}
                              value={question.optionD}
                              onChange={(e) =>
                                updateQuestion(currentPartData.partNumber, qIndex, "optionD", e.target.value)
                              }
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                              <select
                                value={question.correctAnswer}
                                onChange={(e) =>
                                  updateQuestion(currentPartData.partNumber, qIndex, "correctAnswer", e.target.value)
                                }
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
                              onChange={(e) =>
                                updateQuestion(currentPartData.partNumber, qIndex, "script", e.target.value)
                              }
                              placeholder="Full transcript of audio"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No questions yet. Click "+ Add Question" to start.</p>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Creating Test..." : "Create Complete Test"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
