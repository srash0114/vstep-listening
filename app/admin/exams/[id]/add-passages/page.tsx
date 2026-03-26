"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";
import { useLang } from "@/lib/lang";

interface PassageForm {
  id?: string;
  title: string;
  script: string;
  audio_url?: string;
  part_id: string;
}

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  passageCard: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" } as React.CSSProperties,
  input: { background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" } as React.CSSProperties,
};

export default function AddPassagesPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Test | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [partPassages, setPartPassages] = useState<Record<string, PassageForm[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examResponse = await testsApi.getById(examId);
        if (examResponse.success && examResponse.data) {
          setExam(examResponse.data);
          const partsResponse = await testsApi.getParts(examId);
          if (partsResponse.success && partsResponse.data) {
            const filteredParts = (partsResponse.data || []).filter((p: any) => p.part_number >= 2);
            setParts(filteredParts);
            const passages: Record<string, PassageForm[]> = {};
            filteredParts.forEach((part: any) => {
              if (part.passages && part.passages.length > 0) {
                passages[part.id] = part.passages.map((p: any) => ({
                  id: p.id, title: p.title, script: p.script || "", audio_url: p.audio_url || "", part_id: part.id,
                }));
              } else {
                passages[part.id] = Array.from({ length: 3 }, () => ({ title: "", script: "", audio_url: "", part_id: part.id }));
              }
            });
            setPartPassages(passages);
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

  const handlePassageChange = (partId: string, index: number, field: keyof PassageForm, value: string) => {
    setPartPassages((prev) => ({
      ...prev,
      [partId]: prev[partId].map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const addPassage = (partId: string) => {
    setPartPassages((prev) => ({
      ...prev,
      [partId]: [...prev[partId], { title: "", script: "", audio_url: "", part_id: partId }],
    }));
  };

  const removePassage = async (partId: string, index: number) => {
    if (partPassages[partId].length <= 1) return;
    const passage = partPassages[partId][index];
    if (passage.id) {
      if (!confirm("Xóa passage này? Tất cả câu hỏi và đáp án liên quan sẽ bị xóa.")) return;
      try {
        await testsApi.deletePassage(examId, partId, passage.id);
      } catch (err: any) {
        setError(err.message || "Không thể xóa passage");
        return;
      }
    }
    setPartPassages((prev) => ({ ...prev, [partId]: prev[partId].filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      for (const partId in partPassages) {
        const passages = partPassages[partId];
        for (let index = 0; index < passages.length; index++) {
          const passage = passages[index];
          if (!passage.title.trim() || !passage.script.trim()) continue;
          if (passage.id) {
            await testsApi.updatePassage(examId, partId, passage.id, { title: passage.title, script: passage.script, audio_url: passage.audio_url });
          } else {
            await testsApi.createPassage(examId, partId, { title: passage.title, script: passage.script, audio_url: passage.audio_url, passage_order: index + 1 });
          }
        }
      }
      setSuccess("Lưu passage thành công!");
      setTimeout(() => router.push(`/admin/exams/${examId}`), 1000);
    } catch (err: any) {
      setError(err.message || "Không thể lưu passage");
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

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={S.page}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Không tìm thấy đề thi</p>
          <Link href="/admin"><button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>Quay lại Dashboard</button></Link>
        </div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="min-h-screen py-10 px-4" style={S.page}>
        <div className="max-w-4xl mx-auto">
          <Link href={`/admin/exams/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70"
            style={{ color: "#a78bfa" }}>← Quay lại đề thi</Link>
          <div className="rounded-2xl p-8 text-center" style={S.card}>
            <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Chưa có Part nào</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Vui lòng thêm Part trước khi thêm Passage.</p>
            <Link href={`/admin/exams/${examId}/add-part`}>
              <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>Đến trang thêm Part</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const partColors: Record<number, { accent: string; bg: string; border: string }> = {
    2: { accent: "#06b6d4", bg: "rgba(6,182,212,0.06)", border: "rgba(6,182,212,0.2)" },
    3: { accent: "#10b981", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)" },
  };

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link href={`/admin/exams/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70"
          style={{ color: "#a78bfa" }}>← Quay lại đề thi</Link>

        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>Thêm Passage</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bước 3/5 – Thêm passage cho Part 2 & Part 3</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full"
              style={{ background: s <= 3 ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "var(--border-default)" }} />
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl p-8 mb-6" style={S.card}>
          {error && (
            <div className="mb-4 p-4 rounded-xl text-sm flex items-center justify-between"
              style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 hover:opacity-70">✕</button>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 rounded-xl text-sm"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {parts.map((part) => {
              const color = partColors[(part as any).part_number] || partColors[2];
              return (
                <div key={part.id} className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${color.border}` }}>
                  <div className="px-5 py-3" style={{ background: color.bg, borderBottom: `1px solid ${color.border}` }}>
                    <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Part {(part as any).part_number}</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{part.title}</p>
                  </div>

                  <div className="p-5 space-y-4" style={{ background: "var(--bg-surface)" }}>
                    {(partPassages[part.id] || []).map((passage, index) => (
                      <div key={index} className="rounded-xl p-4" style={S.passageCard}>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                            Passage {index + 1}
                            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                              ({(part as any).part_number === 2 ? "4 câu" : "5 câu"})
                            </span>
                          </h3>
                          {(partPassages[part.id]?.length ?? 0) > 1 && (
                            <button type="button" onClick={() => void removePassage(part.id, index)}
                              className="text-xs font-medium transition-opacity hover:opacity-70"
                              style={{ color: "#fb7185" }}>
                              🗑 Xóa
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tiêu đề *</label>
                            <input type="text" value={passage.title}
                              onChange={(e) => handlePassageChange(part.id, index, "title", e.target.value)}
                              placeholder={(part as any).part_number === 2 ? "VD: Hội thoại 1: Tại sân bay" : "VD: Bài giảng 1: Biến đổi khí hậu"}
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                              style={S.input} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>URL Audio (không bắt buộc)</label>
                            <input type="url" value={passage.audio_url || ""}
                              onChange={(e) => handlePassageChange(part.id, index, "audio_url", e.target.value)}
                              placeholder="https://storage.googleapis.com/..."
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono transition-all"
                              style={S.input} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Script / Transcript *</label>
                            <textarea value={passage.script}
                              onChange={(e) => handlePassageChange(part.id, index, "script", e.target.value)}
                              placeholder="Dán toàn bộ nội dung transcript của passage này..."
                              rows={4}
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                              style={S.input} />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={() => addPassage(part.id)}
                      className="w-full py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-all hover:opacity-80"
                      style={{ borderColor: color.border, color: color.accent, background: "transparent" }}>
                      + Thêm Passage khác
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Link href={`/admin/exams/${examId}`}>
                <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", background: "transparent" }}>
                  Hủy
                </button>
              </Link>
              <button type="submit" disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                {isSaving ? "Đang lưu..." : "Lưu Passage & Tiếp tục →"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl p-4 text-sm"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", color: "var(--text-secondary)" }}>
          <strong style={{ color: "#a78bfa" }}>Lưu ý:</strong> Part 2 cần 3 passage (4 câu/passage) · Part 3 cần 3 passage (5 câu/passage).
          Passage thiếu tiêu đề hoặc transcript sẽ bị bỏ qua.
        </div>
      </div>
    </div>
  );
}
