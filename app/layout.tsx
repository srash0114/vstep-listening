import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LangProvider } from "@/lib/lang";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VSTEP Listening – Luyện thi nghe tiếng Anh",
  description: "Luyện thi nghe tiếng Anh chuẩn định dạng VSTEP B1–B2. Làm bài, xem đáp án và theo dõi tiến độ học tập.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <LangProvider>
        <Navbar />
        <main className="pt-16 flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Logo mark */}
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z"/>
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>VSTEP Listening</span>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Luyện thi VSTEP B1–B2</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                © {new Date().getFullYear()} VSTEP Listening
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Online</span>
              </div>
            </div>
          </div>
        </footer>
        </LangProvider>
      </body>
    </html>
  );
}
