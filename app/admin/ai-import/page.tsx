"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { useLang } from "@/lib/lang";

interface ParsedOption { label: string; content: string; is_correct: boolean; }
interface ParsedQuestion { content: string; script?: string; options: ParsedOption[]; }
interface ParsedPassage { title: string; script: string; questions: ParsedQuestion[]; }
interface Part1Data { questions: ParsedQuestion[]; }
interface Part23Data { passages: ParsedPassage[]; }
type ParsedPartData = Part1Data | Part23Data | null;
interface ImportProgress { total: number; done: number; errors: string[]; }
interface AlertState { type: "success" | "error" | "info" | "warning"; message: string; }
interface ExamPart { id: number; part_number: number; title: string; }

function isPart1Data(d: ParsedPartData): d is Part1Data { return d !== null && "questions" in d; }
function isPart23Data(d: ParsedPartData): d is Part23Data { return d !== null && "passages" in d; }

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  elevated: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" } as React.CSSProperties,
  input: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" } as React.CSSProperties,
};

const PART_INFO: Record<number, { label: string; desc: string; accent: string; bg: string; border: string }> = {
  1: { label: "Part 1", desc: "Thông báo (8 câu hỏi)", accent: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)" },
  2: { label: "Part 2", desc: "Hội thoại (3 passage × 4 câu)", accent: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)" },
  3: { label: "Part 3", desc: "Bài giảng (3 passage × 5 câu)", accent: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
};

export default function AIImportPage() {
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [examId, setExamId] = useState("");
  const [examParts, setExamParts] = useState<ExamPart[]>([]);
  const [examLoaded, setExamLoaded] = useState(false);
  const [examLoading, setExamLoading] = useState(false);

  const [parsing, setParsing] = useState<Record<number, boolean>>({});
  const [parsed, setParsed] = useState<Record<number, ParsedPartData>>({});
  const [importing, setImporting] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState<Record<number, ImportProgress>>({});
  const [importDone, setImportDone] = useState<Record<number, boolean>>({});
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [showPreview, setShowPreview] = useState<Record<number, boolean>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (![".txt", ".docx"].includes(ext)) {
      setAlert({ type: "error", message: "Chỉ hỗ trợ file .txt và .docx." });
      return;
    }
    setFile(f);
    setParsed({});
    setImportDone({});
    setProgress({});
    setAlert({ type: "info", message: `Đã tải file: ${f.name}` });
  };

  const loadExam = async () => {
    if (!examId.trim()) { setAlert({ type: "error", message: "Vui lòng nhập Exam ID." }); return; }
    setExamLoading(true);
    setExamLoaded(false);
    try {
      const res = await testsApi.getParts(examId);
      const parts: ExamPart[] = (res.data || []).map((p: any) => ({ id: p.id, part_number: p.part_number, title: p.title }));
      if (parts.length === 0) {
        setAlert({ type: "warning", message: "Không tìm thấy Part nào cho đề thi này. Vui lòng tạo Part trước." });
      } else {
        setExamParts(parts);
        setExamLoaded(true);
        setAlert({ type: "success", message: `Đã tải ${parts.length} Part cho đề thi #${examId}.` });
      }
    } catch {
      setAlert({ type: "error", message: "Không thể tải đề thi. Kiểm tra lại Exam ID." });
    } finally {
      setExamLoading(false);
    }
  };

  const parsePart = async (partNum: number) => {
    if (!file) { setAlert({ type: "error", message: "Vui lòng tải file tài liệu trước." }); return; }
    setParsing((p) => ({ ...p, [partNum]: true }));
    setAlert({ type: "info", message: `Đang gửi Part ${partNum} lên Gemini AI...` });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("part", String(partNum));
      const res = await fetch("/api/ai-import", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Lỗi không xác định");
      setParsed((p) => ({ ...p, [partNum]: json.data }));
      setShowPreview((p) => ({ ...p, [partNum]: true }));
      const count = partNum === 1
        ? (json.data as Part1Data).questions?.length ?? 0
        : (json.data as Part23Data).passages?.reduce((s: number, pg: ParsedPassage) => s + (pg.questions?.length ?? 0), 0) ?? 0;
      setAlert({ type: "success", message: `Part ${partNum} phân tích xong – ${count} câu hỏi.` });
    } catch (err: any) {
      setAlert({ type: "error", message: `Lỗi phân tích Part ${partNum}: ${err.message}` });
    } finally {
      setParsing((p) => ({ ...p, [partNum]: false }));
    }
  };

  const importPart = async (partNum: number) => {
    const data = parsed[partNum];
    if (!data) return;
    const examPart = examParts.find((p) => p.part_number === partNum);
    if (!examPart) {
      setAlert({ type: "error", message: `Part ${partNum} không tìm thấy trong đề thi #${examId}. Hãy tạo Part trước.` });
      return;
    }
    setImporting((p) => ({ ...p, [partNum]: true }));
    const errors: string[] = [];
    try {
      if (partNum === 1 && isPart1Data(data)) {
        const questions = data.questions;
        setProgress((p) => ({ ...p, [partNum]: { total: questions.length, done: 0, errors: [] } }));
        for (let qi = 0; qi < questions.length; qi++) {
          const q = questions[qi];
          try {
            const qRes = await testsApi.createQuestion(examId, String(examPart.id), { part_id: examPart.id, content: q.content, script: q.script || "", difficulty_level: "medium", order_index: qi + 1, question_number: qi + 1 });
            const questionId = qRes?.data?.id;
            if (!questionId) throw new Error("Không nhận được ID câu hỏi");
            for (const opt of q.options) {
              await testsApi.createOption(examId, String(questionId), { content: opt.content, option_label: opt.label, is_correct: opt.is_correct });
            }
          } catch (e: any) { errors.push(`Câu ${qi + 1}: ${e.message || "thất bại"}`); }
          setProgress((p) => ({ ...p, [partNum]: { total: questions.length, done: qi + 1, errors } }));
        }
      } else if ((partNum === 2 || partNum === 3) && isPart23Data(data)) {
        const passages = data.passages;
        const totalQuestions = passages.reduce((s, pg) => s + pg.questions.length, 0);
        setProgress((p) => ({ ...p, [partNum]: { total: totalQuestions, done: 0, errors: [] } }));
        let doneCount = 0;
        for (let pi = 0; pi < passages.length; pi++) {
          const pg = passages[pi];
          try {
            const pgRes = await testsApi.createPassage(examId, String(examPart.id), { title: pg.title || `Passage ${pi + 1}`, script: pg.script || "", passage_order: pi + 1 });
            const passageId = pgRes?.data?.id;
            if (!passageId) throw new Error("Không nhận được ID passage");
            for (let qi = 0; qi < pg.questions.length; qi++) {
              const q = pg.questions[qi];
              try {
                const qRes = await testsApi.createQuestion(examId, String(examPart.id), { part_id: examPart.id, passage_id: passageId, content: q.content, difficulty_level: "medium", order_index: doneCount + qi + 1, question_number: doneCount + qi + 1 });
                const questionId = qRes?.data?.id;
                if (!questionId) throw new Error("Không nhận được ID câu hỏi");
                for (const opt of q.options) {
                  await testsApi.createOption(examId, String(questionId), { content: opt.content, option_label: opt.label, is_correct: opt.is_correct });
                }
              } catch (e: any) { errors.push(`Passage ${pi + 1} Câu ${qi + 1}: ${e.message || "thất bại"}`); }
              doneCount++;
              setProgress((p) => ({ ...p, [partNum]: { total: totalQuestions, done: doneCount, errors } }));
            }
          } catch (e: any) { errors.push(`Passage ${pi + 1}: ${e.message || "thất bại"}`); }
        }
      }
      setImportDone((p) => ({ ...p, [partNum]: true }));
      setAlert({ type: errors.length > 0 ? "warning" : "success", message: errors.length > 0 ? `Part ${partNum} import xong với ${errors.length} lỗi.` : `Part ${partNum} import thành công!` });
    } catch (err: any) {
      setAlert({ type: "error", message: `Import thất bại: ${err.message}` });
    } finally {
      setImporting((p) => ({ ...p, [partNum]: false }));
    }
  };

  const getPartStats = (partNum: number) => {
    const data = parsed[partNum];
    if (!data) return null;
    if (partNum === 1 && isPart1Data(data)) return `${data.questions.length} câu hỏi`;
    if ((partNum === 2 || partNum === 3) && isPart23Data(data)) {
      const total = data.passages.reduce((s, pg) => s + pg.questions.length, 0);
      return `${data.passages.length} passage · ${total} câu hỏi`;
    }
    return null;
  };

  const renderPreview = (partNum: number) => {
    const data = parsed[partNum];
    if (!data) return null;
    if (partNum === 1 && isPart1Data(data)) {
      return (
        <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
          {data.questions.map((q, qi) => (
            <div key={qi} className="rounded-lg p-3" style={S.elevated}>
              <p className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>C{qi + 1}. {q.content}</p>
              {q.script && <p className="text-xs italic mt-1" style={{ color: "var(--text-muted)" }}>Script: {q.script}</p>}
              <ul className="mt-1.5 space-y-0.5">
                {q.options.map((opt) => (
                  <li key={opt.label} className="text-xs px-2 py-0.5 rounded"
                    style={{ background: opt.is_correct ? "rgba(16,185,129,0.12)" : "transparent", color: opt.is_correct ? "#34d399" : "var(--text-muted)", fontWeight: opt.is_correct ? 700 : 400 }}>
                    {opt.label}. {opt.content}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
    if ((partNum === 2 || partNum === 3) && isPart23Data(data)) {
      return (
        <div className="mt-3 space-y-3 max-h-72 overflow-y-auto pr-1">
          {data.passages.map((pg, pi) => (
            <div key={pi} className="rounded-lg p-3" style={S.elevated}>
              <p className="font-bold text-xs mb-1" style={{ color: "#a78bfa" }}>{pg.title}</p>
              {pg.script && <p className="text-xs italic mb-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>Script: {pg.script.slice(0, 100)}...</p>}
              <div className="space-y-1.5">
                {pg.questions.map((q, qi) => (
                  <div key={qi} className="pl-2" style={{ borderLeft: "2px solid rgba(124,58,237,0.3)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>C{qi + 1}. {q.content}</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {q.options.map((opt) => (
                        <li key={opt.label} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: opt.is_correct ? "rgba(16,185,129,0.12)" : "transparent", color: opt.is_correct ? "#34d399" : "var(--text-muted)", fontWeight: opt.is_correct ? 700 : 400 }}>
                          {opt.label}. {opt.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const alertColors: Record<string, { bg: string; border: string; color: string }> = {
    success: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", color: "#34d399" },
    error: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)", color: "#fb7185" },
    info: { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)", color: "#a78bfa" },
    warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", color: "#fbbf24" },
  };

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70"
          style={{ color: "#a78bfa" }}>← Quay lại Dashboard</Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
            ✨ AI Import
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tải file .txt hoặc .docx → Gemini AI phân tích từng Part → Tự động import vào đề thi
          </p>
        </div>

        {/* Alert */}
        {alert && (() => {
          const ac = alertColors[alert.type];
          return (
            <div className="mb-6 p-4 rounded-xl text-sm flex justify-between items-start"
              style={{ background: ac.bg, border: `1px solid ${ac.border}`, color: ac.color }}>
              <span>{alert.message}</span>
              <button onClick={() => setAlert(null)} className="ml-4 hover:opacity-70">✕</button>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Setup */}
          <div className="space-y-5">
            {/* Step 1: Upload */}
            <div className="rounded-2xl p-6" style={S.card}>
              <h2 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Bước 1 – Tải tài liệu</h2>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Hỗ trợ file .txt và .docx</p>

              <div
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
                style={{ borderColor: file ? "#7c3aed" : "var(--border-default)", background: file ? "rgba(124,58,237,0.06)" : "transparent" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".txt,.docx" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <>
                    <div className="text-2xl mb-1">✅</div>
                    <p className="text-sm font-semibold" style={{ color: "#a78bfa" }}>{file.name}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{(file.size / 1024).toFixed(1)} KB · Click để đổi</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Click để tải lên</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>.txt hoặc .docx</p>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Exam ID */}
            <div className="rounded-2xl p-6" style={S.card}>
              <h2 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Bước 2 – Chọn đề thi</h2>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Nhập ID đề thi cần import vào</p>

              <input
                type="number"
                value={examId}
                onChange={(e) => { setExamId(e.target.value); setExamLoaded(false); setExamParts([]); }}
                placeholder="Exam ID (VD: 1)"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3 transition-all"
                style={S.input}
              />
              <button onClick={loadExam} disabled={examLoading || !examId.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                {examLoading ? "Đang tải..." : "Tải Parts của đề thi"}
              </button>

              {examLoaded && examParts.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {examParts.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={S.elevated}>
                      <span className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center text-white shrink-0"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                        {p.part_number}
                      </span>
                      <span className="truncate flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>{p.title}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>#{p.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: "#a78bfa" }}>Cách thức hoạt động</h3>
              <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: "var(--text-secondary)" }}>
                <li>Tải tài liệu đề thi lên</li>
                <li>Nhập ID đề thi đích</li>
                <li>Nhấn "Phân tích" cho từng Part</li>
                <li>Xem trước kết quả</li>
                <li>Nhấn "Import" để lưu</li>
              </ol>
            </div>
          </div>

          {/* Right: Per-part panels */}
          <div className="lg:col-span-2 space-y-5">
            {([1, 2, 3] as const).map((partNum) => {
              const info = PART_INFO[partNum];
              const isParsed = !!parsed[partNum];
              const isImporting = !!importing[partNum];
              const isDone = !!importDone[partNum];
              const prog = progress[partNum];
              const stats = getPartStats(partNum);
              const examPart = examParts.find((p) => p.part_number === partNum);
              const canImport = isParsed && examLoaded && !!examPart && !isDone;

              return (
                <div key={partNum} className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${isDone ? "rgba(16,185,129,0.3)" : info.border}`, background: "var(--bg-surface)" }}>
                  {/* Header */}
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ background: isDone ? "rgba(16,185,129,0.08)" : info.bg, borderBottom: `1px solid ${isDone ? "rgba(16,185,129,0.2)" : info.border}` }}>
                    <div>
                      <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{info.label}</span>
                      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>{info.desc}</span>
                    </div>
                    {isDone && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>✓ Đã import</span>
                    )}
                    {isParsed && !isDone && stats && (
                      <span className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                        {stats}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Action buttons */}
                    <div className="flex gap-3 mb-4">
                      <button onClick={() => parsePart(partNum)} disabled={!file || !!parsing[partNum]}
                        className="flex-1 py-2 px-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #1e1b4b, #374151)" }}>
                        {parsing[partNum] ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Đang phân tích...
                          </span>
                        ) : `✨ Phân tích Part ${partNum}`}
                      </button>

                      <button onClick={() => importPart(partNum)} disabled={!canImport || isImporting}
                        className="flex-1 py-2 px-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                        style={{ background: isDone ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg, #059669, #10b981)", color: isDone ? "#34d399" : "white" }}>
                        {isImporting ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Đang import...
                          </span>
                        ) : isDone ? "✓ Hoàn thành" : `↑ Import Part ${partNum}`}
                      </button>
                    </div>

                    {examLoaded && !examPart && (
                      <p className="text-xs mb-3 p-3 rounded-lg"
                        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                        Part {partNum} không tìm thấy trong đề thi #{examId}. Hãy tạo Part tại{" "}
                        <Link href={`/admin/exams/${examId}/add-part`} className="underline font-semibold">Thêm Part</Link>.
                      </p>
                    )}

                    {prog && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                          <span>{prog.done} / {prog.total} câu hỏi</span>
                          <span>{Math.round((prog.done / prog.total) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full" style={{ background: "var(--border-default)" }}>
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${(prog.done / prog.total) * 100}%`, background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }} />
                        </div>
                        {prog.errors.length > 0 && (
                          <div className="mt-2 max-h-20 overflow-y-auto space-y-0.5">
                            {prog.errors.map((err, i) => (
                              <p key={i} className="text-xs" style={{ color: "#fb7185" }}>✗ {err}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {isParsed && (
                      <>
                        <button onClick={() => setShowPreview((p) => ({ ...p, [partNum]: !p[partNum] }))}
                          className="text-xs underline transition-opacity hover:opacity-70"
                          style={{ color: "#a78bfa" }}>
                          {showPreview[partNum] ? "Ẩn xem trước" : "Xem trước kết quả"}
                        </button>
                        {showPreview[partNum] && renderPreview(partNum)}
                      </>
                    )}

                    {!isParsed && !parsing[partNum] && (
                      <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                        Tải tài liệu và nhấn "Phân tích" để trích xuất nội dung Part {partNum}.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
