"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test } from "@/types";

interface PartForm {
  part_number: number;
  title: string;
  duration: number;
  audio_url: string;
  // from server after saved
  id?: string;
}

const PART_TEMPLATES: Record<number, Omit<PartForm, "id">> = {
  1: { part_number: 1, title: "Part 1: Announcements & Short Messages", duration: 500, audio_url: "" },
  2: { part_number: 2, title: "Part 2: Long Conversations", duration: 800, audio_url: "" },
  3: { part_number: 3, title: "Part 3: Lectures & Talks", duration: 1200, audio_url: "" },
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

  // Per-part state
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
        if (examResponse.success && examResponse.data) {
          setExam(examResponse.data);
        }

        const partsResponse = await testsApi.getParts(examId);
        if (partsResponse.success && partsResponse.data) {
          const existing: any[] = partsResponse.data;
          setParts((prev) =>
            prev.map((p) => {
              const found = existing.find((e) => Number(e.part_number) === p.part_number);
              if (found) {
                return {
                  part_number: p.part_number,
                  title: found.title || p.title,
                  duration: Number(found.duration) || p.duration,
                  audio_url: found.audio_url || "",
                  id: String(found.id),
                };
              }
              return p;
            })
          );
          // Mark already-saved parts
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

    return () => {
      Object.values(audioPreview).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [examId]);

  const updatePart = (partNumber: number, field: keyof PartForm, value: string | number) => {
    setParts((prev) =>
      prev.map((p) => (p.part_number === partNumber ? { ...p, [field]: value } : p))
    );
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
      setErrors((prev) => ({ ...prev, [partNumber]: "Title is required" }));
      return;
    }
    if (!hasFile && !hasUrl) {
      setErrors((prev) => ({ ...prev, [partNumber]: "Please upload an audio file or enter a URL" }));
      return;
    }

    setErrors((prev) => ({ ...prev, [partNumber]: "" }));
    setSaving((prev) => ({ ...prev, [partNumber]: true }));

    try {
      let savedPartId: string | null = part.id || null;

      if (part.id) {
        // Update existing
        await testsApi.updatePart(examId, part.id, {
          title: part.title,
          duration: part.duration,
          audio_url: hasUrl ? part.audio_url : undefined,
        });
        savedPartId = part.id;
      } else {
        // Create new
        const res = await testsApi.createPart(examId, {
          part_number: part.part_number,
          title: part.title,
          duration: part.duration,
          audio_url: hasUrl ? part.audio_url : "",
        });
        const newId = res?.data?.id ? String(res.data.id) : null;
        if (newId) {
          setParts((prev) =>
            prev.map((p) => (p.part_number === partNumber ? { ...p, id: newId } : p))
          );
          savedPartId = newId;
        }
      }

      // Upload audio file if provided
      if (hasFile && savedPartId) {
        const uploadRes = await testsApi.uploadPartAudio(parseInt(savedPartId), audioFiles[partNumber]!);
        const uploadedUrl = uploadRes?.data?.audio_url;
        if (uploadedUrl) {
          setParts((prev) =>
            prev.map((p) => (p.part_number === partNumber ? { ...p, audio_url: uploadedUrl } : p))
          );
          setSuccessMsg((prev) => ({ ...prev, [partNumber]: uploadedUrl }));
        }
      } else {
        setSuccessMsg((prev) => ({ ...prev, [partNumber]: part.audio_url || "Saved" }));
      }

      setSaved((prev) => ({ ...prev, [partNumber]: true }));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [partNumber]: err?.message || "Failed to save part",
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [partNumber]: false }));
    }
  };

  const allSaved = [1, 2, 3].every((n) => saved[n]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Exam not found</p>
          <Link href="/admin" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/admin/exams/${examId}`} className="text-blue-600 hover:text-blue-700 text-sm inline-block mb-3">
            ← Back to Exam
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add Parts</h1>
          <p className="text-gray-500 text-sm mt-1">Save each part individually — upload audio file or enter a URL</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${s <= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
          ))}
        </div>

        {/* Part cards */}
        <div className="space-y-6">
          {parts.map((part) => {
            const mode = uploadMode[part.part_number];
            const file = audioFiles[part.part_number];
            const preview = audioPreview[part.part_number];
            const isSaving = saving[part.part_number];
            const isSaved = saved[part.part_number];
            const partError = errors[part.part_number];

            return (
              <div
                key={part.part_number}
                className={`bg-white rounded-xl shadow-sm border-2 transition-colors ${
                  isSaved ? "border-green-400" : "border-gray-200"
                }`}
              >
                {/* Card header */}
                <div className={`flex items-center justify-between px-6 py-4 rounded-t-xl ${isSaved ? "bg-green-50" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSaved ? "bg-green-500 text-white" : "bg-blue-600 text-white"}`}>
                      {isSaved ? "✓" : part.part_number}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{part.title}</p>
                      {isSaved && <p className="text-green-600 text-xs mt-0.5">Saved</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSavePart(part.part_number)}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      isSaved
                        ? "bg-green-100 hover:bg-green-200 text-green-700"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    } disabled:opacity-50`}
                  >
                    {isSaving ? "Saving..." : isSaved ? "Update" : "Save Part"}
                  </button>
                </div>

                {/* Card body */}
                <div className="px-6 py-5 space-y-4">
                  {partError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{partError}</div>
                  )}

                  {successMsg[part.part_number] && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm space-y-1">
                      <div className="flex items-center gap-2 text-green-700 font-semibold">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Lưu thành công!
                      </div>
                      {successMsg[part.part_number] !== "Saved" && (
                        <div className="ml-6">
                          <p className="text-green-600 text-xs mb-1">Audio URL:</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded break-all font-mono flex-1">
                              {successMsg[part.part_number]}
                            </code>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(successMsg[part.part_number])}
                              className="shrink-0 px-2 py-1 text-xs bg-green-200 hover:bg-green-300 text-green-800 rounded transition"
                              title="Copy URL"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={part.title}
                      onChange={(e) => updatePart(part.part_number, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Duration (seconds) * <span className="font-normal text-gray-400">≈ {Math.round(part.duration / 60)} min</span>
                    </label>
                    <input
                      type="number"
                      value={part.duration}
                      onChange={(e) => updatePart(part.part_number, "duration", parseInt(e.target.value) || 0)}
                      min="60"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Audio */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Audio *</label>

                    {/* Mode toggle */}
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-3">
                      {(["file", "url"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleModeSwitch(part.part_number, m)}
                          className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                            mode === m ? "bg-white text-blue-700 shadow" : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {m === "file" ? "Upload file" : "Enter URL"}
                        </button>
                      ))}
                    </div>

                    {mode === "file" ? (
                      <div>
                        <div
                          onClick={() => fileRefs.current[part.part_number]?.click()}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                            file ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                          }`}
                        >
                          {file ? (
                            <div>
                              <p className="text-sm font-medium text-blue-700">{file.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-2xl mb-1">🎵</p>
                              <p className="text-sm text-gray-500 font-medium">Click to select audio</p>
                              <p className="text-xs text-gray-400 mt-0.5">MP3, WAV, OGG, WebM — max 10 MB</p>
                            </div>
                          )}
                        </div>
                        <input
                          ref={(el) => { fileRefs.current[part.part_number] = el; }}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(part.part_number, e.target.files?.[0] || null)}
                        />
                        {preview && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-1">Preview:</p>
                            <audio controls src={preview} className="w-full h-9" />
                          </div>
                        )}
                        {!file && part.audio_url && (
                          <p className="text-xs text-gray-400 mt-2">Current URL: <span className="font-mono break-all">{part.audio_url}</span></p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={part.audio_url}
                          onChange={(e) => updatePart(part.part_number, "audio_url", e.target.value)}
                          placeholder="https://storage.googleapis.com/..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                        />
                        {part.audio_url && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-1">Preview:</p>
                            <audio controls src={part.audio_url} className="w-full h-9" />
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
            <button className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition">
              ← Back to Exam
            </button>
          </Link>
          {allSaved && (
            <Link href={`/admin/exams/${examId}/add-passages`}>
              <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition">
                All parts saved — Continue to Passages →
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
