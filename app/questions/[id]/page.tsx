"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/lib/lang";

export default function QuestionDetail() {
  const { tx } = useLang();
  const params = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#fb7185" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
          {tx("questionNotFound")}
        </h1>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          {tx("questionDetail")}
        </p>
        <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
          ID: <span className="font-mono" style={{ color: "#a78bfa" }}>{params.id}</span>
        </p>
        <Link href="/">
          <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            {tx("backHome")}
          </button>
        </Link>
      </div>
    </div>
  );
}
