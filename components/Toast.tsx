"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 = no auto-dismiss
  onClose: () => void;
}

const VARIANTS: Record<ToastType, { icon: React.ReactNode; bar: string; bg: string; border: string; text: string }> = {
  success: {
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#10b981" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bar: "#10b981",
    bg: "var(--bg-surface)",
    border: "rgba(16,185,129,0.3)",
    text: "#10b981",
  },
  error: {
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#ef4444" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bar: "#ef4444",
    bg: "var(--bg-surface)",
    border: "rgba(239,68,68,0.3)",
    text: "#ef4444",
  },
  warning: {
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#f59e0b" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bar: "#f59e0b",
    bg: "var(--bg-surface)",
    border: "rgba(245,158,11,0.3)",
    text: "#f59e0b",
  },
  info: {
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#06b6d4" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bar: "#06b6d4",
    bg: "var(--bg-surface)",
    border: "rgba(6,182,212,0.3)",
    text: "#06b6d4",
  },
};

export default function Toast({ type, message, duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const v = VARIANTS[type];

  useEffect(() => {
    // Trigger slide-in
    const enterTimer = setTimeout(() => setVisible(true), 10);
    if (duration > 0) {
      const exitTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
      };
    }
    return () => clearTimeout(enterTimer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "380px",
        width: "calc(100vw - 40px)",
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderLeft: `4px solid ${v.bar}`,
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        transform: visible ? "translateX(0)" : "translateX(calc(100% + 24px))",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
      }}
    >
      {v.icon}
      <p className="flex-1 text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
        {message}
      </p>
      <button
        onClick={handleClose}
        aria-label="Dismiss"
        style={{
          color: "var(--text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "3px",
            borderRadius: "0 0 12px 12px",
            background: v.bar,
            opacity: 0.5,
            animation: visible ? `toast-shrink ${duration}ms linear forwards` : "none",
          }}
        />
      )}

      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
