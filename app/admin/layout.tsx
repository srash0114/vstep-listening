"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user?.isLoggedIn) { router.replace("/login"); return; }
    if (!user?.isAdmin) { router.replace("/"); }
  }, [user, isLoading, router]);

  // Show nothing while checking auth or if not admin
  if (isLoading || !user?.isLoggedIn || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(148,163,184,0.15)", borderTopColor: "#7c3aed" }} />
      </div>
    );
  }

  return <>{children}</>;
}
