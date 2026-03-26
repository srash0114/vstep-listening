import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      <div className="text-center">
        {/* 404 */}
        <div className="relative mb-8">
          <h1 className="text-[8rem] font-black leading-none select-none"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
          Không tìm thấy trang
        </h2>
        <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
          Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              Về trang chủ
            </button>
          </Link>
          <Link href="/admin">
            <button className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
              Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
