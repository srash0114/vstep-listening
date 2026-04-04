"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang";
import Avatar from "@/components/Avatar";

export default function Navbar() {
  const { user, isLoading: authLoading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lang, toggle: toggleLang } = useLang();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = () => setQuickLoginOpen(true);
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
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

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "?";

  if (authLoading) {
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
          background: scrolled ? "rgba(8, 12, 20, 0.92)" : "rgba(8, 12, 20, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.06)"}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-110 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="VSTEP" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>VSTEP</span>
              <span className="text-sm ml-1 hidden sm:inline" style={{ color: "var(--text-muted)" }}>Listening</span>
            </div>
          </Link>

          {/* Right section */}
          <div className="flex items-center gap-2">

            {/* Language toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.06)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>{lang === "vi" ? "VI" : "EN"}</span>
            </button>

            {user?.isLoggedIn ? (
              /* User dropdown */
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
                  <Avatar src={user.avatar_url} initials={initials} size="sm" />
                  <span className="hidden sm:inline text-sm font-medium max-w-[200px] truncate"
                    style={{ color: "var(--text-primary)" }}>
                    {user.full_name ? user.full_name : user.username}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    style={{ color: "var(--text-muted)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

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
                    </div>

                    {[
                      {
                        href: "/", label: lang === "vi" ? "Đề thi" : "Tests",
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      },
                      {
                        href: "/profile", label: lang === "vi" ? "Hồ sơ của tôi" : "My Profile",
                        icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7v1.5a.5.5 0 00.5.5h13a.5.5 0 00.5-.5V21a7 7 0 00-7-7z" /></>
                      },
                      {
                        href: "/results", label: lang === "vi" ? "Kết quả của tôi" : "My Results",
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      },
                      ...(user.isAdmin ? [{
                        href: "/admin", label: lang === "vi" ? "Bảng quản trị" : "Admin Panel", external: false,
                        icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                      }] : [{
                        href: "https://www.youtube.com/watch?v=QyyaAAB7NNQ", label: lang === "vi" ? "Xem Demo Admin" : "Admin Demo", external: true,
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }]),
                    ].map(({ href, label, icon, external }) => external ? (
                      <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
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
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
                        {label}
                      </a>
                    ) : (
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
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : quickLoginOpen ? (
              /* Quick Google login - thay thế vị trí signin/signup khi 401 */
              <div className="flex items-center gap-2">
                <a
                  href="/api/backend/auth/google"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {lang === "vi" ? "Đăng nhập Google" : "Sign in with Google"}
                </a>
                <button
                  onClick={() => setQuickLoginOpen(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Login / Register buttons */
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium px-2 py-2 rounded-xl transition-all duration-200"
                  style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
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
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] sm:inline-block hidden"
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
