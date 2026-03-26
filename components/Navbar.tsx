"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { User } from "@/types";
import { setStoredUser, clearAuth } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import { useLang } from "@/lib/lang";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lang, toggle: toggleLang } = useLang();

  useEffect(() => {
    usersApi.checkStatus()
      .then((res) => {
        if (res.success && res.data) {
          const u = { ...res.data, isLoggedIn: true };
          setUser(u);
          setStoredUser(u);
        } else {
          clearAuth();
          setUser(null);
        }
      })
      .catch(() => { clearAuth(); setUser(null); })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try { await usersApi.logout(); } catch {}
    clearAuth();
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "?";

  if (isLoading) {
    return (
      <div className="fixed top-0 w-full z-50 h-16"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }} />
    );
  }

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(8, 12, 20, 0.92)"
            : "rgba(8, 12, 20, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.06)"}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z"/>
              </svg>
            </div>
            <div className="leading-none">
              <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>VSTEP</span>
              <span className="text-sm ml-1 hidden sm:inline" style={{ color: "var(--text-muted)" }}>Listening</span>
            </div>
          </Link>


          {/* Right section */}
          <div className="flex items-center gap-2">
            {user?.isLoggedIn ? (
              <>
                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl transition-all duration-200"
                    style={{
                      background: dropdownOpen ? "rgba(124, 58, 237, 0.12)" : "transparent",
                      border: `1px solid ${dropdownOpen ? "rgba(124, 58, 237, 0.3)" : "transparent"}`,
                    }}
                    onMouseEnter={e => {
                      if (!dropdownOpen) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(148, 163, 184, 0.06)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!dropdownOpen) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff" }}
                    >
                      {initials}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate"
                      style={{ color: "var(--text-primary)" }}>
                      {user.username}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                      style={{ color: "var(--text-muted)" }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-2xl py-2 z-50 shadow-2xl"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-strong)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)",
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
                          {lang === "vi" ? "Đang đăng nhập" : "Signed in as"}
                        </p>
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.username}</p>

                        {/* Language toggle */}
                        <button
                          type="button"
                          onClick={toggleLang}
                          className="mt-2.5 flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: "var(--bg-overlay)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-secondary)",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)";
                            (e.currentTarget as HTMLElement).style.color = "#a78bfa";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                          }}
                        >
                          <span className="text-base leading-none">{lang === "vi" ? "🇻🇳" : "🇺🇸"}</span>
                          <span style={{ color: "var(--text-muted)" }}>Ngôn ngữ:</span>
                          <span
                            className="ml-auto px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest"
                            style={{
                              background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))",
                              color: "#a78bfa",
                              border: "1px solid rgba(124,58,237,0.25)",
                            }}
                          >
                            {lang === "vi" ? "VI" : "EN"}
                          </span>
                          <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                      </div>

                      {[
                        {
                          href: "/", label: lang === "vi" ? "Đề thi" : "Tests",
                          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        },
                        {
                          href: "/profile", label: lang === "vi" ? "Kết quả của tôi" : "My Results",
                          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        },
                        {
                          href: "/admin", label: lang === "vi" ? "Bảng quản trị" : "Admin Panel",
                          icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                        },
                      ].map(({ href, label, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.06)";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                          }}
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {icon}
                          </svg>
                          {label}
                        </Link>
                      ))}

                      <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "4px", paddingTop: "4px" }}>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left"
                          style={{ color: "#f43f5e" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.08)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          {lang === "vi" ? "Đăng xuất" : "Sign out"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.06)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {lang === "vi" ? "Đăng nhập" : "Sign in"}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
                >
                  {lang === "vi" ? "Bắt đầu" : "Get started"}
                </Link>
              </>
            )}
          </div>
        </div>

      </nav>
    </>
  );
}
