"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { testsApi } from "@/lib/api";

interface Exam {
  id: number;
  title: string;
  description?: string;
  level?: string;
  total_duration?: number;
  total_questions?: number;
}

const LEVEL_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  "B1":    { bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500" },
  "B2":    { bg: "bg-blue-50",     text: "text-blue-700",     dot: "bg-blue-500" },
  "B1-B2": { bg: "bg-indigo-50",   text: "text-indigo-700",   dot: "bg-indigo-500" },
  "C1":    { bg: "bg-purple-50",   text: "text-purple-700",   dot: "bg-purple-500" },
  "C2":    { bg: "bg-rose-50",     text: "text-rose-700",     dot: "bg-rose-500" },
};

const DEFAULT_LEVEL_COLOR = { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };

export default function Home() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testsApi
      .getAll()
      .then((res) => {
        if (res.success) {
          const raw = res.data as any;
          setExams(Array.isArray(raw) ? raw : raw?.exams || raw?.data || []);
        } else {
          setError(res.message || "Failed to load exams");
        }
      })
      .catch((err: any) => setError(err?.message || "Failed to load exams"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              VSTEP English Listening Practice
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
              Luyện nghe{" "}
              <span className="text-indigo-600">VSTEP</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Bộ đề thi nghe tiếng Anh chuẩn định dạng VSTEP. Làm bài, xem đáp án và theo dõi tiến độ học tập.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-5">
              {[
                { icon: "📋", value: "3", label: "Parts / đề" },
                { icon: "❓", value: "35", label: "Câu hỏi" },
                { icon: "⏱", value: "35", label: "Phút" },
                { icon: "🎯", value: "B1–B2", label: "Trình độ" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-base">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exams section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Danh sách đề thi</h2>
            {!loading && exams.length > 0 && (
              <p className="text-sm text-slate-400 mt-0.5">{exams.length} đề thi có sẵn</p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                  <div className="w-16 h-5 bg-slate-100 rounded-full" />
                </div>
                <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-full mb-1" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-6" />
                <div className="flex gap-3 mb-5">
                  <div className="h-4 bg-slate-100 rounded w-20" />
                  <div className="h-4 bg-slate-100 rounded w-16" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && exams.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🎧
            </div>
            <p className="font-semibold text-slate-700 mb-1">Chưa có đề thi nào</p>
            <p className="text-slate-400 text-sm">Quay lại sau để xem đề thi mới nhất</p>
          </div>
        )}

        {/* Grid */}
        {!loading && exams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {!loading && exams.length > 0 && (
        <div className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">Theo dõi tiến độ của bạn</p>
              <p className="text-sm text-slate-400 mt-0.5">Tạo tài khoản để lưu kết quả và xem lịch sử</p>
            </div>
            <Link href="/register"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shrink-0">
              Đăng ký miễn phí →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam }: { exam: Exam }) {
  const lc = LEVEL_COLOR[exam.level ?? ""] ?? DEFAULT_LEVEL_COLOR;

  return (
    <Link href={`/test/${exam.id}`} className="group block h-full">
      <div className="h-full bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5">
        {/* Color accent bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        <div className="p-6 flex flex-col h-[calc(100%-4px)]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z"/>
              </svg>
            </div>
            {exam.level && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${lc.bg} ${lc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${lc.dot}`} />
                {exam.level}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-indigo-700 transition-colors">
            {exam.title}
          </h3>

          {/* Description */}
          {exam.description && (
            <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
              {exam.description}
            </p>
          )}

          <div className="mt-auto">
            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {exam.total_questions ?? 35} câu
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {exam.total_duration ?? 35} phút
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                3 parts
              </span>
            </div>

            {/* CTA button */}
            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Bắt đầu làm bài →
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
