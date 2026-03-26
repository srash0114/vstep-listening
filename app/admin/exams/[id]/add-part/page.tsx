"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test } from "@/types";
import { useLang } from "@/lib/lang";

interface PartForm {
  part_number: number;
  title: string;
  duration: number;
  audio_url: string;
  id?: string;
}

const PART_TEMPLATES: Record<number, Omit<PartForm, "id">> = {
  1: { part_number: 1, title: "Part 1: Thông báo & Tin nhắn ngắn", duration: 500, audio_url: "" },
  2: { part_number: 2, title: "Part 2: Hội thoại dài", duration: 800, audio_url: "" },
  3: { part_number: 3, title: "Part 3: Bài giảng & Diễn thuyết", duration: 1200, audio_url: "" },
};

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  input: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" } as React.CSSProperties,
};

export default function AddPartPage() {
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Test | null>(null);
  const [parts, setParts] = useState<PartForm[]>([
    { ...PART_TEMPLATES[1] },
    { ...PART_TEMPLATES[2] },
    { ...PART_TEMPLATES[3] },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [successMsg, setSuccessMsg] = useState<Record<number, string>>({});
  const [audioFiles, setAudioFiles] = useState<Record<number, File | null>>({ 1: null, 2: null, 3: null });
  const [audioPreview, setAudioPreview] = useState<Record<number, string>>({});
  const [uploadMode, setUploadMode] = useState<Record<number, "file" | "url">>({ 1: "url", 2: "url", 3: "url" });
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examResponse = await testsApi.getById(examId);
        if (examResponse.success && examResponse.data) setExam(examResponse.data);

        const partsResponse = await testsApi.getParts(examId);
        if (partsResponse.success && partsResponse.data) {
          const existing: any[] = partsResponse.data;
          setParts((prev) =>
            prev.map((p) => {
              const found = existing.find((e) => Number(e.part_number) === p.part_number);
              if (found) {
                return { part_number: p.part_number, title: found.title || p.title, duration: Number(found.duration) || p.duration, audio_url: found.audio_url || "", id: String(found.id) };
              }
              return p;
            })
          );
          const savedMap: Record<number, boolean> = {};
          existing.forEach((e) => { savedMap[Number(e.part_number)] = true; });
          setSaved(savedMap);
        }
      } catch (err: any) {
        console.error("Failed to load:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    return () => { Object.values(audioPreview).forEach((url) => URL.revokeObjectURL(url)); };
  }, [examId]);

  const updatePart = (partNumber: number, field: keyof PartForm, value: string | number) => {
    setParts((prev) => prev.map((p) => (p.part_number === partNumber ? { ...p, [field]: value } : p)));
  };

  const handleFileChange = (partNumber: number, file: File | null) => {
    if (audioPreview[partNumber]) URL.revokeObjectURL(audioPreview[partNumber]);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAudioFiles((prev) => ({ ...prev, [partNumber]: file }));
      setAudioPreview((prev) => ({ ...prev, [partNumber]: previewUrl }));
      updatePart(partNumber, "audio_url", "");
    } else {
      setAudioFiles((prev) => ({ ...prev, [partNumber]: null }));
      setAudioPreview((prev) => { const n = { ...prev }; delete n[partNumber]; return n; });
    }
  };

  const handleModeSwitch = (partNumber: number, mode: "file" | "url") => {
    setUploadMode((prev) => ({ ...prev, [partNumber]: mode }));
    if (mode === "url") {
      handleFileChange(partNumber, null);
      if (fileRefs.current[partNumber]) fileRefs.current[partNumber]!.value = "";
    }
  };

  const handleSavePart = async (partNumber: number) => {
    const part = parts.find((p) => p.part_number === partNumber)!;
    const hasFile = !!audioFiles[partNumber];
    const hasUrl = part.audio_url.trim() !== "";

    if (!part.title.trim()) {
      setErrors((prev) => ({ ...prev, [partNumber]: "Tiêu đề là bắt buộc" }));
      return;
    }
    if (!hasFile && !hasUrl) {
      setErrors((prev) => ({ ...prev, [partNumber]: "Vui lòng tải lên file audio hoặc nhập URL" }));
      return;
    }

    setErrors((prev) => ({ ...prev, [partNumber]: "" }));
    setSaving((prev) => ({ ...prev, [partNumber]: true }));

    try {
      let savedPartId: string | null = part.id || null;

      if (part.id) {
        await testsApi.updatePart(examId, part.id, { title: part.title, duration: part.duration, audio_url: hasUrl ? part.audio_url : undefined });
        savedPartId = part.id;
      } else {
        const res = await testsApi.createPart(examId, { part_number: part.part_number, title: part.title, duration: part.duration, audio_url: hasUrl ? part.audio_url : "" });
        const newId = res?.data?.id ? String(res.data.id) : null;
        if (newId) {
          setParts((prev) => prev.map((p) => (p.part_number === partNumber ? { ...p, id: newId } : p)));
          savedPartId = newId;
        }
      }

      if (hasFile && savedPartId) {
        const uploadRes = await testsApi.uploadPartAudio(parseInt(savedPartId), audioFiles[partNumber]!);
        const uploadedUrl = uploadRes?.data?.audio_url;
        if (uploadedUrl) {
          setParts((prev) => prev.map((p) => (p.part_number === partNumber ? { ...p, audio_url: uploadedUrl } : p)));
          setSuccessMsg((prev) => ({ ...prev, [partNumber]: uploadedUrl }));
        }
      } else {
        setSuccessMsg((prev) => ({ ...prev, [partNumber]: part.audio_url || "Đã lưu" }));
      }

      setSaved((prev) => ({ ...prev, [partNumber]: true }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [partNumber]: err?.message || "Không thể lưu part" }));
    } finally {
      setSaving((prev) => ({ ...prev, [partNumber]: false }));
    }
  };

  const allSaved = [1, 2, 3].every((n) => saved[n]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={S.page}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border-default)", borderTopColor: "#7c3aed" }} />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={S.page}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Không tìm thấy đề thi</p>
          <Link href="/admin">
            <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              Quay lại
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const partColors = [
    { accent: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
    { accent: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
    { accent: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  ];

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Link href={`/admin/exams/${examId}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
          style={{ color: "#a78bfa" }}>
          ← Quay lại đề thi
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>Quản lý Part</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Lưu từng part riêng lẻ – tải file audio hoặc nhập URL</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full"
              style={{ background: s <= 2 ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "var(--border-default)" }} />
          ))}
        </div>

        {/* Part cards */}
        <div className="space-y-5">
          {parts.map((part) => {
            const mode = uploadMode[part.part_number];
            const file = audioFiles[part.part_number];
            const preview = audioPreview[part.part_number];
            const isSaving = saving[part.part_number];
            const isSaved = saved[part.part_number];
            const partError = errors[part.part_number];
            const color = partColors[part.part_number - 1];

            return (
              <div key={part.part_number} className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${isSaved ? "rgba(16,185,129,0.3)" : color.border}`, background: "var(--bg-surface)" }}>
                {/* Card header */}
                <div className="px-6 py-4 flex items-center justify-between"
                  style={{ background: isSaved ? "rgba(16,185,129,0.08)" : color.bg, borderBottom: `1px solid ${isSaved ? "rgba(16,185,129,0.2)" : color.border}` }}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
                      style={{ background: isSaved ? "#10b981" : `linear-gradient(135deg, ${color.accent}, ${color.accent}cc)` }}>
                      {isSaved ? "✓" : part.part_number}
                    </span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{part.title}</p>
                      {isSaved && <p className="text-xs mt-0.5" style={{ color: "#34d399" }}>Đã lưu</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSavePart(part.part_number)}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-40"
                    style={{
                      background: isSaved ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg, #7c3aed, #06b6d4)",
                      color: isSaved ? "#34d399" : "white",
                      border: isSaved ? "1px solid rgba(16,185,129,0.3)" : "none",
                    }}
                  >
                    {isSaving ? "Đang lưu..." : isSaved ? "Cập nhật" : "Lưu Part"}
                  </button>
                </div>

                {/* Card body */}
                <div className="px-6 py-5 space-y-4">
                  {partError && (
                    <div className="p-3 rounded-xl text-sm"
                      style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}>
                      {partError}
                    </div>
                  )}

                  {successMsg[part.part_number] && (
                    <div className="p-3 rounded-xl text-sm"
                      style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div className="flex items-center gap-2 font-semibold mb-1" style={{ color: "#34d399" }}>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Lưu thành công!
                      </div>
                      {successMsg[part.part_number] !== "Đã lưu" && (
                        <div className="ml-6">
                          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Audio URL:</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs px-2 py-1 rounded break-all font-mono flex-1"
                              style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>
                              {successMsg[part.part_number]}
                            </code>
                            <button type="button" onClick={() => navigator.clipboard.writeText(successMsg[part.part_number])}
                              className="shrink-0 px-2 py-1 text-xs rounded transition-all hover:opacity-80"
                              style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tiêu đề *</label>
                    <input
                      type="text"
                      value={part.title}
                      onChange={(e) => updatePart(part.part_number, "title", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={S.input}
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Thời lượng (giây) * <span className="font-normal" style={{ color: "var(--text-muted)" }}>≈ {Math.round(part.duration / 60)} phút</span>
                    </label>
                    <input
                      type="number"
                      value={part.duration}
                      onChange={(e) => updatePart(part.part_number, "duration", parseInt(e.target.value) || 0)}
                      min="60"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={S.input}
                    />
                  </div>

                  {/* Audio */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Audio *</label>

                    {/* Mode toggle */}
                    <div className="flex gap-1 p-1 rounded-lg w-fit mb-3"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                      {(["file", "url"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => handleModeSwitch(part.part_number, m)}
                          className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                          style={{
                            background: mode === m ? "var(--bg-surface)" : "transparent",
                            color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                            boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                          }}>
                          {m === "file" ? "Tải file" : "Nhập URL"}
                        </button>
                      ))}
                    </div>

                    {mode === "file" ? (
                      <div>
                        <div
                          onClick={() => fileRefs.current[part.part_number]?.click()}
                          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all"
                          style={{
                            borderColor: file ? color.accent : "var(--border-default)",
                            background: file ? color.bg : "transparent",
                          }}
                        >
                          {file ? (
                            <div>
                              <p className="text-sm font-medium" style={{ color: color.accent }}>{file.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click để thay đổi</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-2xl mb-1">🎵</p>
                              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Click để chọn audio</p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>MP3, WAV, OGG, WebM – tối đa 10 MB</p>
                            </div>
                          )}
                        </div>
                        <input
                          ref={(el) => { fileRefs.current[part.part_number] = el; }}
                          type="file" accept="audio/*" className="hidden"
                          onChange={(e) => handleFileChange(part.part_number, e.target.files?.[0] || null)}
                        />
                        {preview && (
                          <div className="mt-3">
                            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Xem trước:</p>
                            <audio controls src={preview} className="w-full h-9" style={{ filter: "invert(0.85) hue-rotate(180deg)" }} />
                          </div>
                        )}
                        {!file && part.audio_url && (
                          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                            URL hiện tại: <span className="font-mono break-all" style={{ color: "#a78bfa" }}>{part.audio_url}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={part.audio_url}
                          onChange={(e) => updatePart(part.part_number, "audio_url", e.target.value)}
                          placeholder="https://storage.googleapis.com/..."
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono transition-all"
                          style={S.input}
                        />
                        {part.audio_url && (
                          <div className="mt-3">
                            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Xem trước:</p>
                            <audio controls src={part.audio_url} className="w-full h-9" style={{ filter: "invert(0.85) hue-rotate(180deg)" }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <Link href={`/admin/exams/${examId}`}>
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", background: "transparent" }}>
              ← Quay lại đề thi
            </button>
          </Link>
          {allSaved && (
            <Link href={`/admin/exams/${examId}/add-passages`}>
              <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                Tất cả Part đã lưu – Tiếp tục Passage →
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
