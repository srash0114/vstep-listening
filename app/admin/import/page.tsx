"use client";

import { useState } from "react";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { useLang } from "@/lib/lang";

interface ImportResult {
  success: boolean;
  exam_id?: number;
  exam_title?: string;
  message?: string;
  error?: string;
}

interface AudioFiles {
  audio_part_1?: File;
  audio_part_2?: File;
  audio_part_3?: File;
  audio_passage_conv1?: File;
  audio_passage_conv2?: File;
  audio_passage_conv3?: File;
  audio_passage_lec1?: File;
  audio_passage_lec2?: File;
  audio_passage_lec3?: File;
  [key: string]: File | undefined;
}

const EXAMPLE_JSON = {
  exam: {
    title: "VSTEP Listening Test 1",
    description: "Đề thi nghe đầy đủ 3 Part",
    level: "B1",
    total_duration: 35,
    parts: [
      {
        part_number: 1,
        title: "Part 1: Thông báo & Tin nhắn ngắn",
        audio_url: "https://placeholder.com/part1.mp3",
        duration: 500,
        question_count: 8,
        questions: [
          {
            question_number: 1,
            order_index: 1,
            content: "Cuộc họp sẽ bắt đầu lúc mấy giờ?",
            difficulty_level: "3-",
            script: "Cuộc họp dời sang 3 giờ chiều",
            options: [
              { content: "2 giờ chiều", option_label: "A", is_correct: false },
              { content: "3 giờ chiều", option_label: "B", is_correct: true },
              { content: "4 giờ chiều", option_label: "C", is_correct: false },
              { content: "5 giờ chiều", option_label: "D", is_correct: false },
            ],
          },
        ],
      },
    ],
  },
};

const AUDIO_FIELDS = [
  { key: "audio_part_1", label: "Audio Part 1" },
  { key: "audio_part_2", label: "Audio Part 2" },
  { key: "audio_part_3", label: "Audio Part 3" },
  { key: "audio_passage_conv1", label: "Audio Hội thoại 1" },
  { key: "audio_passage_conv2", label: "Audio Hội thoại 2" },
  { key: "audio_passage_conv3", label: "Audio Hội thoại 3" },
  { key: "audio_passage_lec1", label: "Audio Bài giảng 1" },
  { key: "audio_passage_lec2", label: "Audio Bài giảng 2" },
  { key: "audio_passage_lec3", label: "Audio Bài giảng 3" },
];

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  elevated: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" } as React.CSSProperties,
  input: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" } as React.CSSProperties,
};

export default function BulkImportPage() {
  const { t } = useLang();
  const [jsonText, setJsonText] = useState("");
  const [audioFiles, setAudioFiles] = useState<AudioFiles>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [uploadMode, setUploadMode] = useState<"json-only" | "with-audio">("json-only");

  const handleJsonFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const fileContent = await file.text();
      setJsonText(fileContent);
      setAlert({ type: "info", message: "Đã tải file JSON. Kiểm tra và nhấn Import." });
    } catch {
      setAlert({ type: "error", message: "Không thể đọc file JSON." });
    } finally {
      setLoading(false);
    }
  };

  const handleAudioFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"].includes(file.type)) {
      setAlert({ type: "error", message: `Định dạng audio không hợp lệ. Hỗ trợ: mp3, wav, ogg, webm` });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAlert({ type: "error", message: `File audio quá lớn. Tối đa 10MB.` });
      return;
    }
    setAudioFiles((prev) => ({ ...prev, [fieldKey]: file }));
  };

  const validateJSON = (text: string): boolean => {
    try { JSON.parse(text); return true; } catch { return false; }
  };

  const handleImport = async () => {
    if (!jsonText.trim()) { setAlert({ type: "error", message: "Vui lòng dán hoặc tải lên dữ liệu JSON" }); return; }
    if (!validateJSON(jsonText)) { setAlert({ type: "error", message: "Định dạng JSON không hợp lệ. Kiểm tra lại cú pháp." }); return; }
    try {
      setLoading(true);
      const data = JSON.parse(jsonText);
      let response;
      if (uploadMode === "with-audio" && Object.keys(audioFiles).length > 0) {
        const filteredAudioFiles = Object.entries(audioFiles).filter(([_, f]) => f !== undefined).reduce((acc, [key, f]) => { acc[key] = f as File; return acc; }, {} as Record<string, File>);
        response = await testsApi.bulkCreateExamWithAudio(data, filteredAudioFiles);
      } else {
        response = await testsApi.bulkCreateExam(data);
      }
      if (response.success) {
        setImportResult({ success: true, exam_id: response.data?.id || response.data?.exam_id, exam_title: response.data?.title || response.data?.exam_title, message: response.message });
        setAlert({ type: "success", message: `✓ Import thành công! Exam ID: ${response.data?.id || response.data?.exam_id}` });
        setJsonText("");
        setAudioFiles({});
      } else {
        setAlert({ type: "error", message: response.message || "Import thất bại" });
      }
    } catch (error: any) {
      setAlert({ type: "error", message: error?.message || "Không thể import đề thi. Kiểm tra lại JSON." });
    } finally {
      setLoading(false);
    }
  };

  const copyExample = () => {
    navigator.clipboard.writeText(JSON.stringify(EXAMPLE_JSON, null, 2));
    setAlert({ type: "info", message: "Đã copy JSON mẫu!" });
  };

  const alertColors: Record<string, { bg: string; border: string; color: string }> = {
    success: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", color: "#34d399" },
    error: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)", color: "#fb7185" },
    info: { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)", color: "#a78bfa" },
  };

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70"
          style={{ color: "#a78bfa" }}>← Quay lại Dashboard</Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>Import đề thi hàng loạt</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Import đề thi hoàn chỉnh bằng JSON và file audio tùy chọn</p>
        </div>

        {/* Alert */}
        {alert && (() => {
          const ac = alertColors[alert.type] || alertColors.info;
          return (
            <div className="mb-6 p-4 rounded-xl text-sm flex justify-between items-start"
              style={{ background: ac.bg, border: `1px solid ${ac.border}`, color: ac.color }}>
              <span>{alert.message}</span>
              <button onClick={() => setAlert(null)} className="ml-4 hover:opacity-70">✕</button>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl p-8" style={S.card}>
              <h2 className="text-lg font-bold mb-6" style={{ color: "var(--text-primary)" }}>Import đề thi</h2>

              {/* Mode toggle */}
              <div className="mb-6 flex gap-1.5 p-1 rounded-xl w-fit"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                {[
                  { value: "json-only", label: "JSON only" },
                  { value: "with-audio", label: "Kèm Audio" },
                ].map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setUploadMode(value as any)}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: uploadMode === value ? "var(--bg-surface)" : "transparent",
                      color: uploadMode === value ? "var(--text-primary)" : "var(--text-muted)",
                      boxShadow: uploadMode === value ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* JSON section */}
              <div className="mb-8">
                <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Dữ liệu JSON</h3>

                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4"
                  style={{ borderColor: "var(--border-default)" }}
                  onClick={() => document.getElementById("json-file-upload")?.click()}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
                >
                  <input type="file" accept=".json" onChange={handleJsonFileUpload} className="hidden" id="json-file-upload" disabled={loading} />
                  <div className="text-2xl mb-1">📁</div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Click để tải file JSON</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Chỉ chấp nhận định dạng JSON</p>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>HOẶC</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                </div>

                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dán dữ liệu JSON</label>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Dán dữ liệu JSON đề thi vào đây..."
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl font-mono text-sm outline-none resize-none transition-all"
                  style={S.input}
                />
              </div>

              {/* Audio section */}
              {uploadMode === "with-audio" && (
                <div className="mb-8 rounded-xl p-6"
                  style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                  <h3 className="text-sm font-bold mb-2" style={{ color: "#a78bfa" }}>File Audio (Tùy chọn)</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Tải lên file MP3/WAV để upload lên Firebase. Tối đa 10MB/file.</p>
                  <div className="space-y-3">
                    {AUDIO_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          {label}
                          {audioFiles[key] && (
                            <span className="ml-2 font-normal" style={{ color: "#34d399" }}>✓ {audioFiles[key]?.name}</span>
                          )}
                        </label>
                        <input type="file" accept="audio/*" onChange={(e) => handleAudioFileUpload(e, key)}
                          className="block w-full text-sm rounded-lg p-2 cursor-pointer transition-all" disabled={loading}
                          style={S.input} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import button */}
              <button onClick={handleImport} disabled={loading || !jsonText.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                {loading ? "Đang import..." : "Import đề thi"}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Example JSON */}
            <div className="rounded-2xl p-6" style={S.card}>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>JSON mẫu</h3>
              {showExample ? (
                <div className="rounded-xl p-4 text-xs overflow-auto max-h-80 font-mono"
                  style={{ background: "var(--bg-overlay)", color: "#a78bfa" }}>
                  <pre>{JSON.stringify(EXAMPLE_JSON, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Xem ví dụ JSON đề thi hoàn chỉnh</p>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowExample(!showExample)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                  {showExample ? "Ẩn" : "Hiện"}
                </button>
                <button onClick={copyExample}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                  Copy
                </button>
              </div>
            </div>

            {/* Success result */}
            {importResult?.success && (
              <div className="rounded-2xl p-6"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <h3 className="font-bold mb-3" style={{ color: "#34d399" }}>✓ Import thành công!</h3>
                <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                  <strong>Đề thi:</strong> {importResult.exam_title}
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  <strong>Exam ID:</strong> {importResult.exam_id}
                </p>
                <Link href="/admin">
                  <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                    Về Dashboard
                  </button>
                </Link>
              </div>
            )}

            {/* Mode info */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: "#a78bfa" }}>
                {uploadMode === "json-only" ? "Chế độ: JSON only" : "Chế độ: Kèm Audio"}
              </h3>
              {uploadMode === "json-only" ? (
                <ul className="text-xs space-y-1.5" style={{ color: "var(--text-secondary)" }}>
                  <li>✓ Không cần upload file</li>
                  <li>✓ Dùng URL audio có sẵn</li>
                  <li>✓ Nhanh nhất</li>
                </ul>
              ) : (
                <ul className="text-xs space-y-1.5" style={{ color: "var(--text-secondary)" }}>
                  <li>✓ Upload file MP3/WAV</li>
                  <li>✓ Tự động upload Firebase</li>
                  <li>✓ Tối đa 10MB/file</li>
                  <li>✓ Tất cả đều tùy chọn</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
