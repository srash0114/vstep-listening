"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";
import { usersApi, testsApi } from "@/lib/api";
import { User } from "@/types";
import { useLang } from "@/lib/lang";

interface Exam {
  id: number;
  title: string;
  description?: string;
  level?: string;
  total_duration?: number;
  total_questions?: number;
}

const S = {
  page: { background: "var(--bg-base)" } as React.CSSProperties,
  card: { background: "var(--bg-surface)", border: "1px solid var(--border-default)" } as React.CSSProperties,
  cardElevated: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" } as React.CSSProperties,
};

export default function AdminPage() {
  const router = useRouter();
  const { tx } = useLang();
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
            setExams(Array.isArray(raw) ? raw : raw?.exams || raw?.data || []);
          }
        } else {
          clearAuth(); router.push("/login");
        }
      } catch { clearAuth(); router.push("/login"); }
      finally { setIsLoading(false); }
    };
    verifyAuth();
  }, [router]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`${tx("deleteConfirm").replace('"{title}"', `"${title}"`)}`)) return;
    setDeletingId(id);
    try {
      await testsApi.delete(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err?.message || tx("deleteExamError"));
    } finally { setDeletingId(null); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={S.page}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border-default)", borderTopColor: "#7c3aed" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tx("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user?.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={S.page}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>{tx("noPermission")}</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{tx("loginRequired")}</p>
          <Link href="/login" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            {tx("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 pb-16" style={S.page}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              {tx("adminDashboard")}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{tx("adminDescription")}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/ai-import">
              <button
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}
              >
                {tx("aiImport")}
              </button>
            </Link>
            <Link href="/admin/exams/create">
              <button
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                {tx("createNewExam")}
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl flex items-center justify-between text-sm"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 hover:opacity-70">✕</button>
          </div>
        )}

        {/* Exams table */}
        <div className="rounded-2xl overflow-hidden mb-8" style={S.card}>
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{tx("allExams")}</h2>
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {exams.length} {tx("tests")}
            </span>
          </div>

          {exams.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{tx("noExamsYet")}. {tx("createFirstExam")}!</p>
              <Link href="/admin/exams/create">
                <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                  {tx("createExam")}
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {exams.map((exam, i) => (
                <div
                  key={exam.id}
                  className="px-6 py-4 flex items-center gap-4 transition-colors"
                  style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{exam.title}</h3>
                      {exam.level && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}>
                          {exam.level}
                        </span>
                      )}
                    </div>
                    {exam.description && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{exam.description}</p>
                    )}
                    <div className="flex gap-4 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>ID: {exam.id}</span>
                      <span>{exam.total_questions ?? 0} {tx("questions")}</span>
                      <span>{exam.total_duration ?? 0} {tx("minutes")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/exams/${exam.id}`}>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
                        {tx("manage")}
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id, exam.title)}
                      disabled={deletingId === exam.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ background: "rgba(244,63,94,0.1)", color: "#fb7185", border: "1px solid rgba(244,63,94,0.2)" }}
                    >
                      {deletingId === exam.id ? tx("deleting") : tx("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Workflow */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#a78bfa" }}>{tx("workflowTitle")}</h3>
            <ol className="space-y-2.5 text-sm">
              {[
                tx("step1"),
                tx("step2"),
                tx("step3"),
                tx("step4"),
                tx("step5"),
              ].map((step, i) => (
                <li key={i} className="flex gap-3" style={{ color: "var(--text-secondary)" }}>
                  <span className="shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* VSTEP structure */}
          <div className="rounded-2xl p-6" style={S.card}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>{tx("vstepStructure")}</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: tx("part1Label"), sub: tx("part1Sub"), color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
                { label: tx("part2Label"), sub: tx("part2Sub"), color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
                { label: tx("part3Label"), sub: tx("part3Sub"), color: "#10b981", bg: "rgba(16,185,129,0.08)" },
              ].map(({ label, sub, color, bg }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: bg, borderLeft: `3px solid ${color}` }}>
                  <p className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
                </div>
              ))}
              <div className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {tx("vstepTotal")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
