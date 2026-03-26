"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";
import { useLang } from "@/lib/lang";

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

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  elevated: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" } as React.CSSProperties,
  input: { background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" } as React.CSSProperties,
};

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
            if (partsResponse.data.length > 0) setSelectedPart(partsResponse.data[0].id);

            const questionsMap: Record<string, QuestionForm[]> = {};
            (partsResponse.data || []).forEach((part: any) => {
              const allQuestions: QuestionForm[] = [];
              if (part.questions && part.questions.length > 0) {
                part.questions.forEach((q: any) => {
                  allQuestions.push({ id: q.id, content: q.content || q.text || "", passage_id: q.passage_id ? String(q.passage_id) : undefined, difficulty_level: q.difficulty_level, script: q.script, audio_url: q.audio_url, order_index: q.order_index, part_id: part.id });
                });
              }
              if (part.passages && part.passages.length > 0) {
                part.passages.forEach((passage: any) => {
                  if (passage.questions && passage.questions.length > 0) {
                    passage.questions.forEach((q: any) => {
                      allQuestions.push({ id: q.id, content: q.content || q.text || "", passage_id: String(passage.id), difficulty_level: q.difficulty_level, script: q.script, audio_url: q.audio_url, order_index: q.order_index, part_id: part.id });
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
        setError(err.message || "Không thể tải dữ liệu");
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
    const firstPassageId = part && (part as any).passages?.length > 0 ? String((part as any).passages[0].id) : undefined;
    setQuestions((prev) => ({
      ...prev,
      [partId]: [...prev[partId], { content: "", part_id: partId, passage_id: firstPassageId }],
    }));
  };

  const removeQuestion = (partId: string, index: number) => {
    const question = questions[partId]?.[index];
    if (question?.id) setDeletedQuestionIds((prev) => [...prev, question.id!]);
    setQuestions((prev) => ({ ...prev, [partId]: prev[partId].filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      for (const questionId of deletedQuestionIds) {
        await testsApi.deleteQuestion(examId, questionId);
      }
      for (const partId in questions) {
        const questionsList = questions[partId];
        for (let i = 0; i < questionsList.length; i++) {
          const question = questionsList[i];
          if (!question.content.trim()) continue;
          if (question.id) {
            await testsApi.updateQuestion(examId, question.id, { content: question.content, difficulty_level: question.difficulty_level, script: question.script, audio_url: question.audio_url });
          } else {
            const part = parts.find((p) => p.id === partId);
            const partNum = (part as any)?.part_number || 1;
            const baseOffset = partNum === 1 ? 0 : partNum === 2 ? 8 : 20;
            const questionNumber = baseOffset + i + 1;
            await testsApi.createQuestion(examId, partId, { part_id: parseInt(partId), passage_id: question.passage_id ? parseInt(question.passage_id) : undefined, content: question.content, difficulty_level: question.difficulty_level || "3", script: question.script, audio_url: question.audio_url, order_index: i + 1, question_number: questionNumber });
          }
        }
      }
      setSuccess("Lưu câu hỏi thành công!");
      setTimeout(() => router.push(`/admin/exams/${examId}`), 1000);
    } catch (err: any) {
      setError(err.message || "Không thể lưu câu hỏi");
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
            <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Chưa có Part nào</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Vui lòng thêm Part trước khi thêm câu hỏi.</p>
            <Link href={`/admin/exams/${examId}/add-part`}>
              <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>Đến trang thêm Part</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentPart = parts.find((p) => p.id === selectedPart);
  const currentPartPassages = currentPart ? (currentPart as any).passages || [] : [];
  const needsPassage = currentPart && (currentPart as any).part_number >= 2;
  const expectedCount = currentPart ? (currentPart as any).part_number === 1 ? 8 : (currentPart as any).part_number === 2 ? 12 : 15 : 0;

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Link href={`/admin/exams/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70"
          style={{ color: "#a78bfa" }}>← Quay lại đề thi</Link>

        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>Thêm Câu hỏi</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bước 4/5 – Thêm câu hỏi cho từng Part</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full"
              style={{ background: s <= 4 ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "var(--border-default)" }} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl p-5 sticky top-28" style={S.card}>
              <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Các Part</h3>
              <div className="space-y-2">
                {parts.map((part) => {
                  const count = questions[part.id]?.length || 0;
                  const expected = (part as any).part_number === 1 ? 8 : (part as any).part_number === 2 ? 12 : 15;
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
                        {count}/{expected} câu hỏi
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
              {success && (
                <div className="p-4 rounded-xl text-sm"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
                  {success}
                </div>
              )}

              {currentPart && (
                <div className="rounded-2xl p-6" style={S.card}>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      Part {(currentPart as any).part_number}
                    </h2>
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      {questions[currentPart.id]?.length || 0} / {expectedCount} câu
                    </span>
                  </div>
                  <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{currentPart.title}</p>

                  {needsPassage && currentPartPassages.length === 0 && (
                    <div className="p-4 rounded-xl mb-4 text-sm"
                      style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
                      ⚠️ Part này cần có Passage trước. <Link href={`/admin/exams/${examId}/add-passages`}
                        className="underline font-semibold">Thêm Passage →</Link>
                    </div>
                  )}

                  <div className="space-y-4">
                    {(questions[currentPart.id] || []).map((question, index) => (
                      <div key={index} className="rounded-xl p-4" style={S.elevated}>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Câu hỏi {index + 1}</h3>
                          <button type="button" onClick={() => removeQuestion(currentPart.id, index)}
                            className="text-xs transition-opacity hover:opacity-70" style={{ color: "#fb7185" }}>
                            Xóa
                          </button>
                        </div>

                        <div className="space-y-3">
                          {needsPassage && currentPartPassages.length > 0 && (
                            <div>
                              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Passage *</label>
                              <select value={question.passage_id || ""}
                                onChange={(e) => handleQuestionChange(currentPart.id, index, "passage_id", e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                                required>
                                <option value="">-- Chọn Passage --</option>
                                {currentPartPassages.map((p: any) => (
                                  <option key={p.id} value={String(p.id)}>{p.title || `Passage ${p.passage_order || p.id}`}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Nội dung câu hỏi *</label>
                            <textarea value={question.content}
                              onChange={(e) => handleQuestionChange(currentPart.id, index, "content", e.target.value)}
                              placeholder="Chủ đề chính của đoạn văn là gì?"
                              rows={2}
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Độ khó</label>
                              <select value={question.difficulty_level || "3"}
                                onChange={(e) => handleQuestionChange(currentPart.id, index, "difficulty_level", e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                                <option value="3-">3- (Dễ)</option>
                                <option value="3">3 (Trung bình)</option>
                                <option value="4">4 (Khó)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>URL Audio (không bắt buộc)</label>
                              <input type="url" value={question.audio_url || ""}
                                onChange={(e) => handleQuestionChange(currentPart.id, index, "audio_url", e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono transition-all"
                                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Script (không bắt buộc)</label>
                            <textarea value={question.script || ""}
                              onChange={(e) => handleQuestionChange(currentPart.id, index, "script", e.target.value)}
                              placeholder="Nội dung transcript liên quan đến câu hỏi này..."
                              rows={2}
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={() => addQuestion(currentPart.id)}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-all hover:opacity-80"
                    style={{ borderColor: "rgba(124,58,237,0.3)", color: "#a78bfa", background: "transparent" }}>
                    + Thêm câu hỏi
                  </button>
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
                  {isSaving ? "Đang lưu..." : "Lưu câu hỏi & Tiếp tục →"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="rounded-xl p-4 text-sm"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", color: "var(--text-secondary)" }}>
          <strong style={{ color: "#a78bfa" }}>Mục tiêu:</strong> Part 1 → 8 câu · Part 2 → 12 câu (3 passage × 4) · Part 3 → 15 câu (3 passage × 5).
          Câu hỏi không có nội dung sẽ bị bỏ qua.
        </div>
      </div>
    </div>
  );
}
