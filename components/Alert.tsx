interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
}

const VARIANTS = {
  success: {
    container: "bg-emerald-50 border border-emerald-200 text-emerald-800",
    icon: (
      <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    close: "text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100",
  },
  error: {
    container: "bg-red-50 border border-red-200 text-red-800",
    icon: (
      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    close: "text-red-400 hover:text-red-700 hover:bg-red-100",
  },
  warning: {
    container: "bg-amber-50 border border-amber-200 text-amber-800",
    icon: (
      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    close: "text-amber-400 hover:text-amber-700 hover:bg-amber-100",
  },
  info: {
    container: "bg-blue-50 border border-blue-200 text-blue-800",
    icon: (
      <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    close: "text-blue-400 hover:text-blue-700 hover:bg-blue-100",
  },
};

export default function Alert({ type, message, onClose }: AlertProps) {
  const v = VARIANTS[type];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm ${v.container}`} role="alert">
      {v.icon}
      <p className="flex-1 leading-relaxed">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${v.close}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
