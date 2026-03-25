"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { User } from "@/types";
import { setStoredUser, clearAuth } from "@/lib/auth";
import { usersApi } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try { await usersApi.logout(); } catch {}
    clearAuth();
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  if (isLoading) return <div className="h-14 bg-white border-b border-slate-200" />;

  const active = (href: string) => pathname === href;
  const linkCls = (href: string) =>
    `text-sm font-medium transition-colors ${
      active(href) ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
    }`;

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5.07A7 7 0 0 1 19 12h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z"/>
            </svg>
          </div>
          <div className="leading-none">
            <span className="font-bold text-slate-900 text-sm tracking-tight">VSTEP</span>
            <span className="text-slate-400 text-sm ml-1 hidden sm:inline">Listening</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        {user?.isLoggedIn && (
          <div className="hidden md:flex items-center gap-7 flex-1 ml-4">
            <Link href="/" className={linkCls("/")}>Tests</Link>
            <Link href="/profile" className={linkCls("/profile")}>My Results</Link>
            <Link href="/admin" className={linkCls("/admin")}>Admin</Link>
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2">
          {user?.isLoggedIn ? (
            <>
              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                >
                  <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="hidden sm:inline font-medium text-slate-700 max-w-[120px] truncate">
                    {user.username}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.username}</p>
                    </div>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      My Results
                    </Link>
                    <Link href="/admin" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin Panel
                    </Link>
                    <div className="border-t border-slate-100 mt-1.5 pt-1.5">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                <div className="w-5 flex flex-col gap-1">
                  <span className={`h-0.5 bg-slate-600 transition-all origin-center ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                  <span className={`h-0.5 bg-slate-600 transition-all ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
                  <span className={`h-0.5 bg-slate-600 transition-all origin-center ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
                </div>
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">
                Sign in
              </Link>
              <Link href="/register"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && user?.isLoggedIn && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-3 pt-2">
          <div className="space-y-0.5">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
              Tests
            </Link>
            <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
              My Results
            </Link>
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
              Admin
            </Link>
            <div className="border-t border-slate-100 pt-2 mt-2">
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
