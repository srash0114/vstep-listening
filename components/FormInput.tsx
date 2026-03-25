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
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow
          ${error ? "border-red-400 ring-1 ring-red-300" : "border-slate-300 hover:border-slate-400"}`}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
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
