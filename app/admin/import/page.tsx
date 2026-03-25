"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { testsApi } from "@/lib/api";
import Alert from "@/components/Alert";
import FormInput from "@/components/FormInput";

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
    description: "Complete listening test with 3 parts",
    level: "B1",
    total_duration: 35,
    parts: [
      {
        part_number: 1,
        title: "Part 1: Announcements & Short Messages",
        audio_url: "https://placeholder.com/part1.mp3",
        duration: 500,
        question_count: 8,
        questions: [
          {
            question_number: 1,
            order_index: 1,
            content: "What time will the meeting start?",
            difficulty_level: "3-",
            script: "Meeting postponed to 3 PM",
            options: [
              {
                content: "2 PM",
                option_label: "A",
                is_correct: false,
              },
              {
                content: "3 PM",
                option_label: "B",
                is_correct: true,
              },
              {
                content: "4 PM",
                option_label: "C",
                is_correct: false,
              },
              {
                content: "5 PM",
                option_label: "D",
                is_correct: false,
              },
            ],
          },
        ],
      },
    ],
  },
};

const AUDIO_FIELDS = [
  { key: "audio_part_1", label: "Part 1 Audio", required: false },
  { key: "audio_part_2", label: "Part 2 Audio", required: false },
  { key: "audio_part_3", label: "Part 3 Audio", required: false },
  { key: "audio_passage_conv1", label: "Conversation 1 Audio", required: false },
  { key: "audio_passage_conv2", label: "Conversation 2 Audio", required: false },
  { key: "audio_passage_conv3", label: "Conversation 3 Audio", required: false },
  { key: "audio_passage_lec1", label: "Lecture 1 Audio", required: false },
  { key: "audio_passage_lec2", label: "Lecture 2 Audio", required: false },
  { key: "audio_passage_lec3", label: "Lecture 3 Audio", required: false },
];

export default function BulkImportPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [audioFiles, setAudioFiles] = useState<AudioFiles>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [uploadMode, setUploadMode] = useState<"json-only" | "with-audio">("json-only");

  // ==================== File Upload Handler (JSON) ====================
  const handleJsonFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const fileContent = await file.text();
      setJsonText(fileContent);
      setAlert({
        type: "info",
        message: "JSON file loaded successfully. Review and click Import.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: "Failed to read JSON file. Make sure it's a valid JSON file.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== Audio File Upload Handler ====================
  const handleAudioFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldKey: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"].includes(file.type)) {
      setAlert({
        type: "error",
        message: `Invalid audio format for ${fieldKey}. Supported: mp3, wav, ogg, webm`,
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setAlert({
        type: "error",
        message: `Audio file too large. Max 10MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      });
      return;
    }

    setAudioFiles((prev) => ({
      ...prev,
      [fieldKey]: file,
    }));
  };

  // ==================== Validate JSON ====================
  const validateJSON = (text: string): boolean => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

  // ==================== Import Handler ====================
  const handleImport = async () => {
    if (!jsonText.trim()) {
      setAlert({ type: "error", message: "Please paste or upload JSON data" });
      return;
    }

    if (!validateJSON(jsonText)) {
      setAlert({ type: "error", message: "Invalid JSON format. Please check syntax." });
      return;
    }

    try {
      setLoading(true);
      const data = JSON.parse(jsonText);

      if (uploadMode === "with-audio" && Object.keys(audioFiles).length > 0) {
        // Filter out undefined audio files
        const filteredAudioFiles = Object.entries(audioFiles)
          .filter(([_, file]) => file !== undefined)
          .reduce((acc, [key, file]) => {
            acc[key] = file as File;
            return acc;
          }, {} as Record<string, File>);

        // Call bulk import with audio uploads (multipart)
        const response = await testsApi.bulkCreateExamWithAudio(data, filteredAudioFiles);

        if (response.success) {
          setImportResult({
            success: true,
            exam_id: response.data?.id || response.data?.exam_id,
            exam_title: response.data?.title || response.data?.exam_title,
            message: response.message,
          });
          setAlert({
            type: "success",
            message: `✓ Exam imported successfully with audio! Exam ID: ${
              response.data?.id || response.data?.exam_id
            }`,
          });
          setJsonText("");
          setAudioFiles({});
        } else {
          setAlert({
            type: "error",
            message: response.message || "Import failed",
          });
        }
      } else {
        // Call bulk import without audio (JSON only)
        const response = await testsApi.bulkCreateExam(data);

        if (response.success) {
          setImportResult({
            success: true,
            exam_id: response.data?.id || response.data?.exam_id,
            exam_title: response.data?.title || response.data?.exam_title,
            message: response.message,
          });
          setAlert({
            type: "success",
            message: `✓ Exam imported successfully! Exam ID: ${
              response.data?.id || response.data?.exam_id
            }`,
          });
          setJsonText("");
        } else {
          setAlert({
            type: "error",
            message: response.message || "Import failed",
          });
        }
      }
    } catch (error: any) {
      setAlert({
        type: "error",
        message:
          error?.message || error?.error || "Failed to import exam. Please check your JSON.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== Copy Example ====================
  const copyExample = () => {
    const jsonString = JSON.stringify(EXAMPLE_JSON, null, 2);
    navigator.clipboard.writeText(jsonString);
    setAlert({ type: "info", message: "Example JSON copied to clipboard!" });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Bulk Import Exams</h1>
          <p className="text-gray-600 mt-2">
            Import complete exams with JSON and optional audio files
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Import Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Exam</h2>

              {/* Mode Selection */}
              <div className="mb-6 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="json-only"
                    checked={uploadMode === "json-only"}
                    onChange={(e) => setUploadMode(e.target.value as "json-only")}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 font-semibold">JSON Only</span>
                  <span className="text-gray-500 text-sm">(with existing URLs)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="with-audio"
                    checked={uploadMode === "with-audio"}
                    onChange={(e) => setUploadMode(e.target.value as "with-audio")}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 font-semibold">With Audio Upload</span>
                  <span className="text-gray-500 text-sm">(Firebase)</span>
                </label>
              </div>

              {/* JSON Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">JSON Data</h3>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Upload JSON File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileUpload}
                      className="hidden"
                      id="json-file-upload"
                      disabled={loading}
                    />
                    <label htmlFor="json-file-upload" className="cursor-pointer block">
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-gray-700 font-semibold">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-gray-500 text-sm">JSON format only</p>
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-gray-500 text-sm">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* JSON Text Input */}
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Paste JSON Data
                </label>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Paste your JSON exam data here..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Audio Section (Conditional) */}
              {uploadMode === "with-audio" && (
                <div className="mb-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">Audio Files (Optional)</h3>
                  <p className="text-purple-800 text-sm mb-4">
                    Upload MP3/WAV audio files to Firebase Storage. Max 10MB per file.
                  </p>

                  {/* Audio Upload Grid */}
                  <div className="space-y-4">
                    {AUDIO_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {label}
                          {audioFiles[key as keyof AudioFiles] && (
                            <span className="ml-2 text-green-600 text-xs">
                              ✓ {audioFiles[key as keyof AudioFiles]?.name}
                            </span>
                          )}
                        </label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleAudioFileUpload(e, key)}
                          className="block w-full text-sm border border-gray-300 rounded-lg p-2 cursor-pointer"
                          disabled={loading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={loading || !jsonText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                {loading ? "Importing..." : "Import Exam"}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Example JSON */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Example JSON</h3>
              {showExample ? (
                <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-96 font-mono">
                  <pre>{JSON.stringify(EXAMPLE_JSON, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">
                  See what a complete exam JSON looks like
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowExample(!showExample)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-3 rounded text-sm transition"
                >
                  {showExample ? "Hide" : "Show"}
                </button>
                <button
                  onClick={copyExample}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded text-sm transition"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Success Result */}
            {importResult?.success && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                <h3 className="text-lg font-bold text-green-900 mb-2">✓ Success!</h3>
                <p className="text-green-800 text-sm mb-3">
                  <strong>Exam:</strong> {importResult.exam_title}
                </p>
                <p className="text-green-800 text-sm mb-4">
                  <strong>Exam ID:</strong> {importResult.exam_id}
                </p>
                <Link
                  href={`/admin`}
                  className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded text-center text-sm transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            )}

            {/* Mode Info */}
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3">Mode Info</h3>
              {uploadMode === "json-only" ? (
                <ul className="text-blue-800 text-sm space-y-2">
                  <li>✓ No file uploads needed</li>
                  <li>✓ Use existing audio URLs</li>
                  <li>✓ Fastest option</li>
                </ul>
              ) : (
                <ul className="text-blue-800 text-sm space-y-2">
                  <li>✓ Upload MP3/WAV files</li>
                  <li>✓ Auto-upload to Firebase</li>
                  <li>✓ Max 10MB per file</li>
                  <li>✓ All files optional</li>
                </ul>
              )}
            </div>

            {/* JSON Format Guide Link */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Check the format guide for complete JSON structure requirements.
              </p>
              <a
                href="https://github.com/yourusername/vstep-listening/blob/main/app/admin/JSON_FORMAT_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded text-center text-sm transition"
              >
                View Format Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

