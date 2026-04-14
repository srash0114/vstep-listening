interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
}

export default function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  rows = 4,
}: TextareaProps) {
  return (
    <div className="mb-4">
      <label className="block font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow ${
          error ? "border-red-500" : ""
        }`}
        style={{
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          border: `1px solid ${error ? "#ef4444" : "var(--border-default)"}`,
        }}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
