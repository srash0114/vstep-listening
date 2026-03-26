"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { useLang } from "@/lib/lang";

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  input: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" } as React.CSSProperties,
  label: { color: "var(--text-secondary)" } as React.CSSProperties,
};

export default function CreateExamPage() {
  const router = useRouter();
  const { t } = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "B1",
    total_duration: 35,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "total_duration" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await testsApi.create(formData);
      if (response.success && response.data) {
        router.push(`/admin/exams/${response.data.id}`);
      } else {
        setError(response.message || "Không thể tạo đề thi");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    "Tạo đề thi",
    "Thêm Part",
    "Thêm Passage",
    "Thêm câu hỏi",
    "Thêm đáp án",
    "Hoàn thành",
  ];

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
          style={{ color: "#a78bfa" }}>
          ← Quay lại Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
            Tạo đề thi mới
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bước 1/6 – Thông tin cơ bản</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-1.5 mb-2">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{ background: i === 0 ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "var(--border-default)" }} />
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Bước 1: Thông tin cơ bản</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-8 mb-6" style={S.card}>
          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between"
              style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 hover:opacity-70">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={S.label}>
                Tiêu đề đề thi *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="VD: VSTEP Listening – Đề luyện tập số 1"
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={S.input}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#7c3aed"}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={S.label}>
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả ngắn về đề thi này (không bắt buộc)"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                style={S.input}
                onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = "#7c3aed"}
                onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = "var(--border-default)"}
              />
            </div>

            {/* Level & Duration row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={S.label}>
                  Trình độ *
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={S.input}
                >
                  <option value="A1">A1 – Sơ cấp</option>
                  <option value="A2">A2 – Cơ bản</option>
                  <option value="B1">B1 – Trung cấp</option>
                  <option value="B2">B2 – Trên trung cấp</option>
                  <option value="C1">C1 – Nâng cao</option>
                  <option value="C2">C2 – Thành thạo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={S.label}>
                  Thời gian (phút) *
                </label>
                <input
                  type="number"
                  name="total_duration"
                  value={formData.total_duration}
                  onChange={handleChange}
                  min="1"
                  max="120"
                  required
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={S.input}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#7c3aed"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"}
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Chuẩn VSTEP: 35 phút</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Link href="/admin">
                <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", background: "transparent" }}>
                  Hủy
                </button>
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                {isLoading ? "Đang tạo..." : "Tạo đề & Tiếp tục →"}
              </button>
            </div>
          </form>

          {/* Info note */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#a78bfa" }}>Tiếp theo là gì?</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Sau khi tạo đề thi, bạn sẽ thêm 3 Part với file audio, sau đó thêm Passage, câu hỏi và đáp án A–D.
            </p>
          </div>
        </div>

        {/* Workflow steps */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>Quy trình hoàn chỉnh</h3>
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 text-white"
                  style={{ background: i === 0 ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "var(--border-default)" }}>
                  {i + 1}
                </span>
                <span style={{ color: i === 0 ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === 0 ? 700 : 400 }}>
                  {step}{i === 0 ? " ← bạn đang ở đây" : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
