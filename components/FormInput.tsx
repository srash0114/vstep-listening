interface FormInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export default function FormInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
}: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${error ? "border-red-400 ring-1 ring-red-300" : "hover:border-slate-400"}`}
        style={{ 
          background: "var(--bg-surface)", 
          color: "var(--text-primary)", 
          borderColor: error ? undefined : "var(--border-subtle)" 
        }}
      />
      {hint && !error && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
