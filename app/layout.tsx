import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="pt-14 flex-1">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">VSTEP Listening</span>
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} VSTEP Listening. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
