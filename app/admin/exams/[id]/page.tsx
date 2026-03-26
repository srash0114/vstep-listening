"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";
import { useLang } from "@/lib/lang";

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  elevated: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" } as React.CSSProperties,
};

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
        const examResponse = await testsApi.getById(examId);
        if (examResponse.success && examResponse.data) {
          setExam(examResponse.data);
          const partsResponse = await testsApi.getParts(examId);
          if (partsResponse.success && partsResponse.data) {
            setParts(partsResponse.data);
          }
        } else {
          setError("Không tìm thấy đề thi");
          router.push("/admin");
        }
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Không thể tải đề thi");
        setIsLoading(false);
      }
    };
    fetchData();
  }, [examId, router]);

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

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={S.page}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Có lỗi xảy ra</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{error || "Không tìm thấy đề thi"}</p>
          <Link href="/admin">
            <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              Quay lại Dashboard
            </button>
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
    optionsAdded: parts.some(p => p.questions?.some(q => q.options && q.options.length === 4)),
  };

  const nextStep = !completedSteps.partsAdded ? "parts" :
    !completedSteps.passagesAdded ? "passages" :
    !completedSteps.questionsAdded ? "questions" :
    !completedSteps.optionsAdded ? "options" : null;

  const stepCards = [
    { key: "created", done: completedSteps.created, icon: "📝", label: "Đã tạo đề", sub: "Thông tin cơ bản" },
    { key: "parts", done: completedSteps.partsAdded, icon: "🎵", label: "Parts", sub: `${parts.length}/3` },
    { key: "passages", done: completedSteps.passagesAdded, icon: "📖", label: "Passages", sub: `${parts.reduce((a, p) => a + (p.passages?.length || 0), 0)} đoạn` },
    { key: "questions", done: completedSteps.questionsAdded, icon: "❓", label: "Câu hỏi", sub: `${parts.reduce((a, p) => a + (p.questions?.length || 0), 0)} câu` },
    { key: "options", done: completedSteps.optionsAdded, icon: "🔘", label: "Đáp án", sub: "A, B, C, D" },
    { key: "complete", done: nextStep === null, icon: "🏁", label: "Hoàn thành", sub: nextStep === null ? "Sẵn sàng!" : "Đang thực hiện" },
  ];

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
          style={{ color: "#a78bfa" }}>
          ← Quay lại Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              {exam.title}
            </h1>
            {exam.description && (
              <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{exam.description}</p>
            )}
            <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Trình độ: <strong style={{ color: "var(--text-secondary)" }}>{exam.level}</strong></span>
              <span>Thời gian: <strong style={{ color: "var(--text-secondary)" }}>{exam.total_duration || (exam as any).duration || 0} phút</strong></span>
              <span>ID: <strong style={{ color: "var(--text-secondary)" }}>{exam.id}</strong></span>
            </div>
          </div>
          <Link href={`/admin/exams/${exam.id}/add-part`}>
            <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
              ⚙️ Quản lý Part
            </button>
          </Link>
        </div>

        {/* Progress overview */}
        <div className="rounded-2xl p-8 mb-6" style={S.card}>
          <h2 className="text-lg font-bold mb-6" style={{ color: "var(--text-primary)" }}>Tiến độ đề thi</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {stepCards.map(({ key, done, icon, label, sub }) => (
              <div key={key} className="rounded-xl p-4 transition-all"
                style={{
                  background: done ? "rgba(16,185,129,0.08)" : "var(--bg-elevated)",
                  border: done ? "1px solid rgba(16,185,129,0.2)" : "1px solid var(--border-subtle)",
                }}>
                <div className="text-2xl mb-2">{done ? "✅" : icon}</div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</h3>
                <p className="text-xs mt-0.5" style={{ color: done ? "#34d399" : "var(--text-muted)" }}>{sub}</p>
              </div>
            ))}
          </div>

          {nextStep && (
            <div className="p-4 rounded-xl mb-4"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <h3 className="font-semibold text-sm mb-2" style={{ color: "#a78bfa" }}>📌 Bước tiếp theo được đề xuất</h3>
              {nextStep === "parts" && <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Thêm 3 Part (Part 1, 2, 3) kèm URL audio.</p>}
              {nextStep === "passages" && <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Thêm Passage cho Part 2 và Part 3 (3 đoạn mỗi part).</p>}
              {nextStep === "questions" && <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Thêm câu hỏi cho từng part (8 / 12 / 15 câu).</p>}
              {nextStep === "options" && <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Thêm đáp án A, B, C, D cho mỗi câu hỏi.</p>}
              <Link href={`/admin/exams/${exam.id}/add-${nextStep === "options" ? "options" : nextStep === "questions" ? "questions" : nextStep === "passages" ? "passages" : "part"}`}>
                <button className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                  Tiếp tục →
                </button>
              </Link>
            </div>
          )}

          {nextStep === null && (
            <div className="p-4 rounded-xl"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "#34d399" }}>🎉 Đề thi hoàn thành!</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Tất cả part đã được cấu hình với đầy đủ passage, câu hỏi và đáp án.</p>
            </div>
          )}
        </div>

        {/* Parts overview */}
        {parts.length > 0 && (
          <div className="rounded-2xl p-8 mb-6" style={S.card}>
            <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text-primary)" }}>Chi tiết các Part</h2>
            <div className="space-y-3">
              {parts.map((part) => (
                <div key={part.id} className="rounded-xl p-4 transition-all"
                  style={S.elevated}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.3)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                        Part {(part as any).part_number}
                      </h3>
                      <p className="text-xs mb-2 truncate" style={{ color: "var(--text-muted)" }}>{part.title}</p>
                      <div className="flex gap-4 text-xs">
                        <span style={{ color: part.passages && part.passages.length > 0 ? "#34d399" : "var(--text-muted)" }}>
                          📖 Passages: {part.passages?.length || 0}
                        </span>
                        <span style={{ color: part.questions && part.questions.length > 0 ? "#34d399" : "var(--text-muted)" }}>
                          ❓ Câu hỏi: {part.questions?.length || 0}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          🔊 Audio: {(part as any).audio_url ? "✓" : "✗"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {(part as any).part_number >= 2 && (
                        <Link href={`/admin/exams/${exam.id}/add-passages`}>
                          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
                            Passages
                          </button>
                        </Link>
                      )}
                      <Link href={`/admin/exams/${exam.id}/add-questions`}>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "rgba(6,182,212,0.1)", color: "#38bdf8", border: "1px solid rgba(6,182,212,0.2)" }}>
                          Câu hỏi
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        {parts.length > 0 && (
          <div className="rounded-2xl p-6" style={S.elevated}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>Thao tác nhanh</h3>
            <div className="flex flex-wrap gap-3">
              {!completedSteps.partsAdded && (
                <Link href={`/admin/exams/${exam.id}/add-part`}>
                  <button className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                    + Thêm Part
                  </button>
                </Link>
              )}
              {completedSteps.partsAdded && !completedSteps.passagesAdded && (
                <Link href={`/admin/exams/${exam.id}/add-passages`}>
                  <button className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
                    + Thêm Passage
                  </button>
                </Link>
              )}
              {completedSteps.passagesAdded && !completedSteps.questionsAdded && (
                <Link href={`/admin/exams/${exam.id}/add-questions`}>
                  <button className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #06b6d4, #10b981)" }}>
                    + Thêm câu hỏi
                  </button>
                </Link>
              )}
              <Link href={`/admin/exams/${exam.id}/add-options`}>
                <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  Quản lý đáp án
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
