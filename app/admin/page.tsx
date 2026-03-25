"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";
import { usersApi, testsApi } from "@/lib/api";
import { User } from "@/types";

interface Exam {
  id: number;
  title: string;
  description?: string;
  level?: string;
  total_duration?: number;
  total_questions?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const statusResponse = await usersApi.checkStatus();
        if (statusResponse.success && statusResponse.data) {
          setUser({ ...statusResponse.data, isLoggedIn: true });
          const testsResponse = await testsApi.getAll();
          if (testsResponse.success) {
            const raw = testsResponse.data as any;
            const arr = Array.isArray(raw) ? raw : raw?.exams || raw?.data || [];
            setExams(arr);
          }
        } else {
          clearAuth();
          router.push("/login");
        }
      } catch {
        clearAuth();
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    verifyAuth();
  }, [router]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This will remove all parts, questions, and options.`)) return;
    setDeletingId(id);
    try {
      await testsApi.delete(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err?.message || "Failed to delete exam");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access the admin panel</p>
          <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage VSTEP listening exams</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/ai-import">
              <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition">
                ✨ AI Import
              </button>
            </Link>
            <Link href="/admin/exams/create">
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition">
                + Create New Exam
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
          </div>
        )}

        {/* Exams List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Exams</h2>
            <span className="text-sm text-gray-500">{exams.length} total</span>
          </div>

          {exams.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500 mb-4">No exams yet. Create your first exam to get started.</p>
              <Link href="/admin/exams/create">
                <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create First Exam
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {exams.map((exam) => (
                <div key={exam.id} className="px-6 py-4 hover:bg-gray-50 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                      {exam.level && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {exam.level}
                        </span>
                      )}
                    </div>
                    {exam.description && (
                      <p className="text-gray-500 text-sm mt-0.5 truncate">{exam.description}</p>
                    )}
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>ID: {exam.id}</span>
                      <span>{exam.total_questions ?? 0} questions</span>
                      <span>{exam.total_duration ?? 0} min</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/exams/${exam.id}`}>
                      <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition">
                        Manage
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id, exam.title)}
                      disabled={deletingId === exam.id}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition disabled:opacity-40"
                    >
                      {deletingId === exam.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Workflow */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Step-by-Step Workflow</h3>
            <ol className="space-y-2.5 text-sm">
              {[
                "Create Exam – title, level, duration",
                "Add 3 Parts – with audio URLs",
                "Add Passages – Part 2 & 3 only (3 each)",
                "Add Questions – 8 / 12 / 15 per part",
                "Add Options – A, B, C, D per question",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-blue-900">
                  <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* VSTEP Structure */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">VSTEP Structure</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r p-3">
                <p className="font-semibold text-gray-900">Part 1: Announcements</p>
                <p className="text-gray-500 text-xs mt-0.5">8 questions · 1 audio · No passages</p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 rounded-r p-3">
                <p className="font-semibold text-gray-900">Part 2: Conversations</p>
                <p className="text-gray-500 text-xs mt-0.5">12 questions · 3 passages × 4 questions each</p>
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r p-3">
                <p className="font-semibold text-gray-900">Part 3: Lectures</p>
                <p className="text-gray-500 text-xs mt-0.5">15 questions · 3 passages × 5 questions each</p>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-400 rounded-r p-3">
                <p className="font-semibold text-gray-900">Total: 35 questions · 140 options · 7 audio files</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
