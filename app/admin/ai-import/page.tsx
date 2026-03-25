"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { testsApi } from "@/lib/api";

// ==================== Types ====================
interface ParsedOption {
  label: string;
  content: string;
  is_correct: boolean;
}

interface ParsedQuestion {
  content: string;
  script?: string;
  options: ParsedOption[];
}

interface ParsedPassage {
  title: string;
  script: string;
  questions: ParsedQuestion[];
}

interface Part1Data {
  questions: ParsedQuestion[];
}

interface Part23Data {
  passages: ParsedPassage[];
}

type ParsedPartData = Part1Data | Part23Data | null;

interface ImportProgress {
  total: number;
  done: number;
  errors: string[];
}

interface AlertState {
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ExamPart {
  id: number;
  part_number: number;
  title: string;
}

// ==================== Helpers ====================
function isPart1Data(d: ParsedPartData): d is Part1Data {
  return d !== null && "questions" in d;
}
function isPart23Data(d: ParsedPartData): d is Part23Data {
  return d !== null && "passages" in d;
}

// ==================== Page ====================
export default function AIImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [examId, setExamId] = useState("");
  const [examParts, setExamParts] = useState<ExamPart[]>([]);
  const [examLoaded, setExamLoaded] = useState(false);
  const [examLoading, setExamLoading] = useState(false);

  // Per-part states
  const [parsing, setParsing] = useState<Record<number, boolean>>({});
  const [parsed, setParsed] = useState<Record<number, ParsedPartData>>({});
  const [importing, setImporting] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState<Record<number, ImportProgress>>({});
  const [importDone, setImportDone] = useState<Record<number, boolean>>({});

  const [alert, setAlert] = useState<AlertState | null>(null);
  const [showPreview, setShowPreview] = useState<Record<number, boolean>>({});

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowed = [".txt", ".docx"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setAlert({ type: "error", message: "Only .txt and .docx files are supported." });
      return;
    }

    setFile(f);
    setParsed({});
    setImportDone({});
    setProgress({});
    setAlert({ type: "info", message: `File loaded: ${f.name}` });
  };

  // ── Load exam parts ────────────────────────────────────────────────────────
  const loadExam = async () => {
    if (!examId.trim()) {
      setAlert({ type: "error", message: "Please enter an Exam ID." });
      return;
    }
    setExamLoading(true);
    setExamLoaded(false);
    try {
      const res = await testsApi.getParts(examId);
      const parts: ExamPart[] = (res.data || []).map((p: any) => ({
        id: p.id,
        part_number: p.part_number,
        title: p.title,
      }));
      if (parts.length === 0) {
        setAlert({
          type: "warning",
          message:
            "No parts found for this exam. Please create parts first via the normal workflow.",
        });
      } else {
        setExamParts(parts);
        setExamLoaded(true);
        setAlert({
          type: "success",
          message: `Loaded ${parts.length} part(s) for Exam #${examId}.`,
        });
      }
    } catch {
      setAlert({ type: "error", message: "Failed to load exam. Check the Exam ID." });
    } finally {
      setExamLoading(false);
    }
  };

  // ── Parse a part with Gemini ───────────────────────────────────────────────
  const parsePart = async (partNum: number) => {
    if (!file) {
      setAlert({ type: "error", message: "Please upload a document first." });
      return;
    }
    setParsing((p) => ({ ...p, [partNum]: true }));
    setAlert({ type: "info", message: `Sending Part ${partNum} to Gemini AI...` });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("part", String(partNum));

      const res = await fetch("/api/ai-import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Unknown error");
      }

      setParsed((p) => ({ ...p, [partNum]: json.data }));
      setShowPreview((p) => ({ ...p, [partNum]: true }));

      const count =
        partNum === 1
          ? (json.data as Part1Data).questions?.length ?? 0
          : (json.data as Part23Data).passages?.reduce(
              (s: number, pg: ParsedPassage) => s + (pg.questions?.length ?? 0),
              0
            ) ?? 0;

      setAlert({
        type: "success",
        message: `Part ${partNum} parsed successfully — ${count} question(s) found.`,
      });
    } catch (err: any) {
      setAlert({ type: "error", message: `Part ${partNum} parse error: ${err.message}` });
    } finally {
      setParsing((p) => ({ ...p, [partNum]: false }));
    }
  };

  // ── Import a part ──────────────────────────────────────────────────────────
  const importPart = async (partNum: number) => {
    const data = parsed[partNum];
    if (!data) return;

    const examPart = examParts.find((p) => p.part_number === partNum);
    if (!examPart) {
      setAlert({
        type: "error",
        message: `Part ${partNum} not found in this exam. Create it first.`,
      });
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
            const qRes = await testsApi.createQuestion(examId, String(examPart.id), {
              part_id: examPart.id,
              content: q.content,
              script: q.script || "",
              difficulty_level: "medium",
              order_index: qi + 1,
              question_number: qi + 1,
            });
            const questionId = qRes?.data?.id;
            if (!questionId) throw new Error("No question ID returned");

            for (const opt of q.options) {
              await testsApi.createOption(examId, String(questionId), {
                content: opt.content,
                option_label: opt.label,
                is_correct: opt.is_correct,
              });
            }
          } catch (e: any) {
            errors.push(`Q${qi + 1}: ${e.message || "failed"}`);
          }
          setProgress((p) => ({
            ...p,
            [partNum]: { total: questions.length, done: qi + 1, errors },
          }));
        }
      } else if ((partNum === 2 || partNum === 3) && isPart23Data(data)) {
        const passages = data.passages;
        const totalQuestions = passages.reduce((s, pg) => s + pg.questions.length, 0);
        setProgress((p) => ({
          ...p,
          [partNum]: { total: totalQuestions, done: 0, errors: [] },
        }));

        let doneCount = 0;
        for (let pi = 0; pi < passages.length; pi++) {
          const pg = passages[pi];
          try {
            const pgRes = await testsApi.createPassage(examId, String(examPart.id), {
              title: pg.title || `Passage ${pi + 1}`,
              script: pg.script || "",
              passage_order: pi + 1,
            });
            const passageId = pgRes?.data?.id;
            if (!passageId) throw new Error("No passage ID returned");

            for (let qi = 0; qi < pg.questions.length; qi++) {
              const q = pg.questions[qi];
              try {
                const qRes = await testsApi.createQuestion(examId, String(examPart.id), {
                  part_id: examPart.id,
                  passage_id: passageId,
                  content: q.content,
                  difficulty_level: "medium",
                  order_index: doneCount + qi + 1,
                  question_number: doneCount + qi + 1,
                });
                const questionId = qRes?.data?.id;
                if (!questionId) throw new Error("No question ID returned");

                for (const opt of q.options) {
                  await testsApi.createOption(examId, String(questionId), {
                    content: opt.content,
                    option_label: opt.label,
                    is_correct: opt.is_correct,
                  });
                }
              } catch (e: any) {
                errors.push(`Passage ${pi + 1} Q${qi + 1}: ${e.message || "failed"}`);
              }
              doneCount++;
              setProgress((p) => ({
                ...p,
                [partNum]: { total: totalQuestions, done: doneCount, errors },
              }));
            }
          } catch (e: any) {
            errors.push(`Passage ${pi + 1}: ${e.message || "failed"}`);
          }
        }
      }

      setImportDone((p) => ({ ...p, [partNum]: true }));
      setAlert({
        type: errors.length > 0 ? "warning" : "success",
        message:
          errors.length > 0
            ? `Part ${partNum} imported with ${errors.length} error(s). Check progress below.`
            : `Part ${partNum} imported successfully!`,
      });
    } catch (err: any) {
      setAlert({ type: "error", message: `Import failed: ${err.message}` });
    } finally {
      setImporting((p) => ({ ...p, [partNum]: false }));
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderPreview = (partNum: number) => {
    const data = parsed[partNum];
    if (!data) return null;

    if (partNum === 1 && isPart1Data(data)) {
      return (
        <div className="mt-3 space-y-3 max-h-80 overflow-y-auto pr-1">
          {data.questions.map((q, qi) => (
            <div key={qi} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="font-semibold text-sm text-gray-800">
                Q{qi + 1}. {q.content}
              </p>
              {q.script && (
                <p className="text-xs text-gray-500 italic mt-1">Script: {q.script}</p>
              )}
              <ul className="mt-2 space-y-1">
                {q.options.map((opt) => (
                  <li
                    key={opt.label}
                    className={`text-sm px-2 py-0.5 rounded ${
                      opt.is_correct
                        ? "bg-green-100 text-green-800 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
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
        <div className="mt-3 space-y-4 max-h-80 overflow-y-auto pr-1">
          {data.passages.map((pg, pi) => (
            <div key={pi} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="font-bold text-sm text-blue-800">{pg.title}</p>
              {pg.script && (
                <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                  Script: {pg.script.slice(0, 120)}...
                </p>
              )}
              <div className="mt-2 space-y-2">
                {pg.questions.map((q, qi) => (
                  <div key={qi} className="pl-2 border-l-2 border-blue-200">
                    <p className="text-sm text-gray-800 font-medium">
                      Q{qi + 1}. {q.content}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {q.options.map((opt) => (
                        <li
                          key={opt.label}
                          className={`text-xs px-2 py-0.5 rounded ${
                            opt.is_correct
                              ? "bg-green-100 text-green-700 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
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

  const getPartStats = (partNum: number) => {
    const data = parsed[partNum];
    if (!data) return null;
    if (partNum === 1 && isPart1Data(data)) {
      return `${data.questions.length} questions`;
    }
    if ((partNum === 2 || partNum === 3) && isPart23Data(data)) {
      const total = data.passages.reduce((s, pg) => s + pg.questions.length, 0);
      return `${data.passages.length} passages · ${total} questions`;
    }
    return null;
  };

  const PART_LABELS: Record<number, { color: string; label: string; desc: string }> = {
    1: { color: "blue", label: "Part 1", desc: "Announcements (8 questions)" },
    2: { color: "purple", label: "Part 2", desc: "Conversations (3 passages × 4 Q)" },
    3: { color: "orange", label: "Part 3", desc: "Lectures (3 passages × 5 Q)" },
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">AI Document Import</h1>
          <p className="text-gray-600 mt-2">
            Upload a .txt or .docx exam document → Gemini AI parses each part → auto-import into your exam.
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`mb-6 p-4 rounded-lg border font-medium text-sm flex justify-between items-start
              ${alert.type === "success" ? "bg-green-50 border-green-400 text-green-800" : ""}
              ${alert.type === "error" ? "bg-red-50 border-red-400 text-red-800" : ""}
              ${alert.type === "info" ? "bg-blue-50 border-blue-400 text-blue-800" : ""}
              ${alert.type === "warning" ? "bg-yellow-50 border-yellow-400 text-yellow-800" : ""}
            `}
          >
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-4 text-lg leading-none opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Upload + Exam setup */}
          <div className="space-y-6">
            {/* Step 1: Upload file */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Step 1 — Upload Document</h2>
              <p className="text-xs text-gray-500 mb-4">Supports .txt and .docx files</p>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
                  ${file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <>
                    <div className="text-3xl mb-1">✅</div>
                    <p className="text-green-700 font-semibold text-sm">{file.name}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-1">📄</div>
                    <p className="text-gray-700 font-semibold text-sm">Click to upload</p>
                    <p className="text-gray-400 text-xs">.txt or .docx</p>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Exam ID */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Step 2 — Select Exam</h2>
              <p className="text-xs text-gray-500 mb-4">Enter the exam ID to import into</p>

              <input
                type="number"
                value={examId}
                onChange={(e) => {
                  setExamId(e.target.value);
                  setExamLoaded(false);
                  setExamParts([]);
                }}
                placeholder="Exam ID (e.g. 1)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <button
                onClick={loadExam}
                disabled={examLoading || !examId.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg text-sm transition"
              >
                {examLoading ? "Loading..." : "Load Exam Parts"}
              </button>

              {examLoaded && examParts.length > 0 && (
                <div className="mt-4 space-y-1">
                  {examParts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded px-3 py-1.5"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                        {p.part_number}
                      </span>
                      <span className="truncate">{p.title}</span>
                      <span className="ml-auto text-xs text-gray-400">#{p.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-blue-900 text-sm mb-2">How it works</h3>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Upload your exam document</li>
                <li>Enter the target exam ID</li>
                <li>Click "Parse" for each part</li>
                <li>Review the preview</li>
                <li>Click "Import" to save</li>
              </ol>
              <p className="text-xs text-blue-600 mt-3">
                Each part uses a different AI prompt tailored to Part 1 / Part 2 / Part 3 structure.
              </p>
            </div>
          </div>

          {/* Right column: Per-part panels */}
          <div className="lg:col-span-2 space-y-5">
            {([1, 2, 3] as const).map((partNum) => {
              const info = PART_LABELS[partNum];
              const isParsed = !!parsed[partNum];
              const isImporting = !!importing[partNum];
              const isDone = !!importDone[partNum];
              const prog = progress[partNum];
              const stats = getPartStats(partNum);
              const examPart = examParts.find((p) => p.part_number === partNum);
              const canImport = isParsed && examLoaded && !!examPart && !isDone;

              const borderColor =
                info.color === "blue"
                  ? "border-blue-400"
                  : info.color === "purple"
                  ? "border-purple-400"
                  : "border-orange-400";
              const headerBg =
                info.color === "blue"
                  ? "bg-blue-600"
                  : info.color === "purple"
                  ? "bg-purple-600"
                  : "bg-orange-500";

              return (
                <div
                  key={partNum}
                  className={`bg-white rounded-xl shadow-sm border-2 ${borderColor} overflow-hidden`}
                >
                  {/* Part header */}
                  <div className={`${headerBg} px-5 py-3 flex items-center justify-between`}>
                    <div>
                      <span className="text-white font-bold">{info.label}</span>
                      <span className="text-white/70 text-xs ml-2">{info.desc}</span>
                    </div>
                    {isDone && (
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        ✓ Imported
                      </span>
                    )}
                    {isParsed && !isDone && (
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                        {stats}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Action buttons */}
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => parsePart(partNum)}
                        disabled={!file || !!parsing[partNum]}
                        className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg text-sm transition"
                      >
                        {parsing[partNum] ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Parsing...
                          </span>
                        ) : (
                          `✨ Parse Part ${partNum} with AI`
                        )}
                      </button>

                      <button
                        onClick={() => importPart(partNum)}
                        disabled={!canImport || isImporting}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg text-sm transition"
                      >
                        {isImporting ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Importing...
                          </span>
                        ) : isDone ? (
                          "✓ Done"
                        ) : (
                          `↑ Import Part ${partNum}`
                        )}
                      </button>
                    </div>

                    {/* Missing part warning */}
                    {examLoaded && !examPart && (
                      <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-3 py-2 mb-3">
                        Part {partNum} not found in Exam #{examId}. Create it first via{" "}
                        <Link href={`/admin/exams/${examId}/add-part`} className="underline">
                          Add Parts
                        </Link>
                        .
                      </p>
                    )}

                    {/* Import progress */}
                    {prog && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>
                            {prog.done} / {prog.total} questions
                          </span>
                          <span>{Math.round((prog.done / prog.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(prog.done / prog.total) * 100}%` }}
                          />
                        </div>
                        {prog.errors.length > 0 && (
                          <div className="mt-2 max-h-24 overflow-y-auto">
                            {prog.errors.map((err, i) => (
                              <p key={i} className="text-xs text-red-600">
                                ✗ {err}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preview toggle */}
                    {isParsed && (
                      <>
                        <button
                          onClick={() =>
                            setShowPreview((p) => ({ ...p, [partNum]: !p[partNum] }))
                          }
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          {showPreview[partNum] ? "Hide preview" : "Show preview"}
                        </button>
                        {showPreview[partNum] && renderPreview(partNum)}
                      </>
                    )}

                    {/* Empty state */}
                    {!isParsed && !parsing[partNum] && (
                      <p className="text-sm text-gray-400 text-center py-4">
                        Upload a document and click "Parse" to extract Part {partNum} content.
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
