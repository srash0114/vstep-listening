"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import { Test, Part } from "@/types";

interface PassageForm {
  id?: string;
  title: string;
  script: string;
  audio_url?: string;
  part_id: string;
}

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
                  id: p.id,
                  title: p.title,
                  script: p.script || "",
                  audio_url: p.audio_url || "",
                  part_id: part.id,
                }));
              } else {
                const count = part.part_number === 2 ? 3 : 3;
                passages[part.id] = Array.from({ length: count }, () => ({
                  title: "",
                  script: "",
                  audio_url: "",
                  part_id: part.id,
                }));
              }
            });
            setPartPassages(passages);
          }
        }
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const handlePassageChange = (
    partId: string,
    index: number,
    field: keyof PassageForm,
    value: string
  ) => {
    setPartPassages((prev) => ({
      ...prev,
      [partId]: prev[partId].map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
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
      if (!confirm("Delete this passage? This will also delete all its questions and options.")) return;
      try {
        await testsApi.deletePassage(examId, partId, passage.id);
      } catch (err: any) {
        setError(err.message || "Failed to delete passage");
        return;
      }
    }

    setPartPassages((prev) => ({
      ...prev,
      [partId]: prev[partId].filter((_, i) => i !== index),
    }));
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
            await testsApi.updatePassage(examId, partId, passage.id, {
              title: passage.title,
              script: passage.script,
              audio_url: passage.audio_url,
            });
          } else {
            await testsApi.createPassage(examId, partId, {
              title: passage.title,
              script: passage.script,
              audio_url: passage.audio_url,
              passage_order: index + 1,
            });
          }
        }
      }

      setSuccess("Passages saved successfully!");
      setTimeout(() => router.push(`/admin/exams/${examId}`), 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save passages");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Exam not found</p>
          <Link href="/admin" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href={`/admin/exams/${examId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Exam
          </Link>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Parts Available</h1>
            <p className="text-gray-600 mb-6">Add parts first before adding passages.</p>
            <Link href={`/admin/exams/${examId}/add-part`}>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Add Parts
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/admin/exams/${examId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
            ← Back to Exam
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Add Passages</h1>
          <p className="text-gray-500">Step 3 of 5: Add passages for Part 2 & Part 3</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`flex-1 h-2 rounded-full ${s <= 3 ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {parts.map((part) => (
              <div key={part.id} className="border-2 border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Part {part.part_number}</h2>
                <p className="text-gray-500 text-sm mb-5">{part.title}</p>

                <div className="space-y-5">
                  {(partPassages[part.id] || []).map((passage, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          Passage {index + 1}
                          {part.part_number === 2 ? " (4 questions)" : " (5 questions)"}
                        </h3>
                        {(partPassages[part.id]?.length ?? 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => void removePassage(part.id, index)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                          <input
                            type="text"
                            value={passage.title}
                            onChange={(e) => handlePassageChange(part.id, index, "title", e.target.value)}
                            placeholder={part.part_number === 2 ? "e.g., Conversation 1: At the Airport" : "e.g., Lecture 1: Climate Change"}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Audio URL (optional)</label>
                          <input
                            type="url"
                            value={passage.audio_url || ""}
                            onChange={(e) => handlePassageChange(part.id, index, "audio_url", e.target.value)}
                            placeholder="https://storage.googleapis.com/..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Script / Transcript *</label>
                          <textarea
                            value={passage.script}
                            onChange={(e) => handlePassageChange(part.id, index, "script", e.target.value)}
                            placeholder="Paste the full transcript of this passage..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addPassage(part.id)}
                  className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg text-gray-500 hover:text-blue-600 transition text-sm font-medium"
                >
                  + Add Another Passage
                </button>
              </div>
            ))}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link href={`/admin/exams/${examId}`}>
                <button type="button" className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition text-sm"
              >
                {isSaving ? "Saving..." : "Save Passages & Continue →"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
          <strong>Note:</strong> Part 2 needs 3 passages (4 questions each) · Part 3 needs 3 passages (5 questions each).
          Passages without a title or script will be skipped.
        </div>
      </div>
    </div>
  );
}
