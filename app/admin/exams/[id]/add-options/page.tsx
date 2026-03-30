"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";
import { useLang } from "@/lib/lang";

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

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  elevated: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" } as React.CSSProperties,
};

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
    const buildOptions = (existingOptions: any[]): OptionForm[] =>
      ["A", "B", "C", "D"].map((label, i) => {
        const ex = existingOptions?.find((o: any) => o.option_label === label) ?? existingOptions?.[i];
        return {
          id: ex?.id ? String(ex.id) : undefined,
          content: ex?.content || "",
          option_label: label,
          is_correct: ex ? Boolean(ex.is_correct) : false,
        };
      });

    const fetchData = async () => {
      try {
        const examResponse = await testsApi.AdminGetById(examId);
        const examData = examResponse.data as any;

        setExam(examData);

        const rawParts: any[] = examData?.parts || [];
        setParts(rawParts.map((p: any) => ({ ...p, id: String(p.id) })));

        const qwo: Record<string, QuestionWithOptions[]> = {};
        for (const part of rawParts) {
          const partId = String(part.id);
          const questions: QuestionWithOptions[] = [];

          // Part 1: direct questions
          for (const q of part.questions || []) {
            questions.push({
              id: String(q.id),
              content: q.content,
              passage_id: q.passage_id ? String(q.passage_id) : undefined,
              options: buildOptions(q.options || []),
            });
          }

          // Parts 2/3: questions inside passages
          for (const passage of part.passages || []) {
            for (const q of passage.questions || []) {
              questions.push({
                id: String(q.id),
                content: q.content,
                passage_id: String(passage.id),
                options: buildOptions(q.options || []),
              });
            }
          }

          qwo[partId] = questions;
        }

        setQuestionsWithOptions(qwo);
        if (rawParts.length > 0) setSelectedPart(String(rawParts[0].id));
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [examId]);

  const handleOptionChange = (partId: string, questionIndex: number, optionIndex: number, field: keyof OptionForm, value: string | boolean) => {
    setQuestionsWithOptions((prev) => ({
      ...prev,
      [partId]: prev[partId].map((q, qi) =>
        qi === questionIndex
          ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? { ...opt, [field]: value } : opt) }
          : q
      ),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      for (const partId in questionsWithOptions) {
        const questionsList = questionsWithOptions[partId];
        for (const question of questionsList) {
          if (question.options.some((opt) => !opt.content.trim())) {
            setError("Tất cả đáp án phải có nội dung");
            setIsSaving(false);
            return;
          }
          const correctCount = question.options.filter((opt) => opt.is_correct).length;
          if (correctCount !== 1) {
            setError(`Câu "${question.content.substring(0, 50)}..." phải có đúng 1 đáp án đúng`);
            setIsSaving(false);
            return;
          }
          for (let i = 0; i < question.options.length; i++) {
            const option = question.options[i];
            const optionLabel = String.fromCharCode(65 + i);
            if (option.id) {
              await testsApi.updateOption(examId, question.id, option.id, { content: option.content, option_label: optionLabel, is_correct: option.is_correct });
            } else {
              await testsApi.createOption(examId, question.id, { content: option.content, option_label: optionLabel, is_correct: option.is_correct });
            }
          }
        }
      }
      router.push(`/admin/exams/${examId}`);
    } catch (err: any) {
      setError(err.message || "Không thể lưu đáp án");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={S.page}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border-default)", borderTopColor: "#7c3aed" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!exam || parts.length === 0) {
    return (
      <div className="min-h-screen py-10 px-4" style={S.page}>
        <div className="max-w-4xl mx-auto">
          <Link href={`/admin/exams/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70"
            style={{ color: "#a78bfa" }}>← Quay lại đề thi</Link>
          <div className="rounded-2xl p-8 text-center" style={S.card}>
            <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Chưa có câu hỏi nào</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Vui lòng thêm câu hỏi trước khi thêm đáp án.</p>
            <Link href={`/admin/exams/${examId}/add-questions`}>
              <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>Đến trang thêm câu hỏi</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentPart = parts.find((p) => p.id === selectedPart);
  const currentQuestions = currentPart ? questionsWithOptions[currentPart.id] || [] : [];
  const optionLetters = ["A", "B", "C", "D"];
  const optionColors = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b"];

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Link href={`/admin/exams/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70"
          style={{ color: "#a78bfa" }}>← Quay lại đề thi</Link>

        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>Thêm Đáp án</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bước 5/6 – Thêm đáp án A, B, C, D cho mỗi câu hỏi</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full"
              style={{ background: s <= 5 ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "var(--border-default)" }} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl p-5 sticky top-28" style={S.card}>
              <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Các Part</h3>
              <div className="space-y-2">
                {parts.map((part) => {
                  const partQuestions = questionsWithOptions[part.id] || [];
                  const completeCount = partQuestions.filter((q) =>
                    q.options.every((opt) => opt.content.trim()) && q.options.some((opt) => opt.is_correct)
                  ).length;
                  const isSelected = selectedPart === part.id;
                  return (
                    <button key={part.id} onClick={() => setSelectedPart(part.id)}
                      className="w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm"
                      style={{
                        background: isSelected ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))" : "var(--bg-elevated)",
                        border: isSelected ? "1px solid rgba(124,58,237,0.3)" : "1px solid var(--border-subtle)",
                        color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      }}>
                      <div className="font-semibold">Part {(part as any).part_number}</div>
                      <div className="text-xs mt-0.5" style={{ color: isSelected ? "#a78bfa" : "var(--text-muted)" }}>
                        {completeCount}/{partQuestions.length} ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl text-sm flex items-center justify-between"
                  style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}>
                  <span>{error}</span>
                  <button type="button" onClick={() => setError(null)} className="ml-4 hover:opacity-70">✕</button>
                </div>
              )}

              {currentPart && currentQuestions.length > 0 && (
                <div className="space-y-4">
                  {currentQuestions.map((question, questionIndex) => (
                    <div key={question.id} className="rounded-2xl p-6" style={S.card}>
                      <h3 className="font-bold text-sm mb-4 pb-3" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
                        Câu {questionIndex + 1}: {question.content}
                      </h3>

                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => {
                          const color = optionColors[optionIndex];
                          return (
                            <div key={optionIndex} className="flex items-start gap-3 p-3 rounded-xl transition-all"
                              style={{
                                background: option.is_correct ? `${color}15` : "var(--bg-elevated)",
                                border: option.is_correct ? `1px solid ${color}40` : "1px solid var(--border-subtle)",
                              }}>
                              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 text-white"
                                style={{ background: option.is_correct ? color : "var(--bg-overlay)" }}>
                                {optionLetters[optionIndex]}
                              </span>

                              <textarea
                                value={option.content}
                                onChange={(e) => handleOptionChange(currentPart.id, questionIndex, optionIndex, "content", e.target.value)}
                                placeholder={`Nhập đáp án ${optionLetters[optionIndex]}`}
                                rows={2}
                                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
                                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  handleOptionChange(currentPart.id, questionIndex, optionIndex, "is_correct", !option.is_correct);
                                  if (!option.is_correct) {
                                    question.options.forEach((_, i) => {
                                      if (i !== optionIndex && question.options[i].is_correct) {
                                        handleOptionChange(currentPart.id, questionIndex, i, "is_correct", false);
                                      }
                                    });
                                  }
                                }}
                                className="px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all hover:opacity-90"
                                style={{
                                  background: option.is_correct ? color : "var(--bg-overlay)",
                                  color: option.is_correct ? "white" : "var(--text-muted)",
                                  border: option.is_correct ? `1px solid ${color}` : "1px solid var(--border-default)",
                                }}
                              >
                                {option.is_correct ? "✓ Đúng" : "Đúng?"}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex gap-4 text-xs">
                        {question.options.every((opt) => opt.content.trim()) ? (
                          <span style={{ color: "#34d399" }}>✓ Đủ 4 đáp án</span>
                        ) : (
                          <span style={{ color: "#fbbf24" }}>⚠ Còn đáp án trống</span>
                        )}
                        {question.options.filter((opt) => opt.is_correct).length === 1 ? (
                          <span style={{ color: "#34d399" }}>✓ Có đáp án đúng</span>
                        ) : (
                          <span style={{ color: "#fb7185" }}>✗ Cần đúng 1 đáp án đúng</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentPart && currentQuestions.length === 0 && (
                <div className="rounded-2xl p-8 text-center" style={S.elevated}>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Part này chưa có câu hỏi</p>
                  <Link href={`/admin/exams/${examId}/add-questions`}>
                    <button type="button" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                      Thêm câu hỏi trước
                    </button>
                  </Link>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 rounded-2xl p-5" style={S.card}>
                <Link href={`/admin/exams/${examId}`}>
                  <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", background: "transparent" }}>
                    Hủy
                  </button>
                </Link>
                <button type="submit" disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                  {isSaving ? "Đang lưu..." : "Lưu đáp án & Hoàn thành"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="rounded-xl p-4 text-sm"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", color: "var(--text-secondary)" }}>
          <strong style={{ color: "#a78bfa" }}>Yêu cầu:</strong> Mỗi câu hỏi cần đúng 4 đáp án (A, B, C, D) · Tất cả đáp án phải có nội dung · Chính xác 1 đáp án đúng cho mỗi câu.
        </div>
      </div>
    </div>
  );
}
