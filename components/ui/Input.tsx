import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  suffix?: ReactNode;
};

export function Input({ label, error, suffix, className = "", ...props }: InputProps) {
  return (
    <label className="grid w-full min-w-0 gap-2 text-sm font-medium text-[var(--text-primary)]">
      {label && <span>{label}</span>}
      <span className="relative block w-full min-w-0 overflow-hidden">
        <input className={`input-base ${suffix ? "pr-11" : ""} ${className}`} {...props} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
      </span>
      {error && <span className="text-xs font-medium text-[#FF4D6D]">{error}</span>}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: ReactNode;
};

export function Textarea({ label, error, hint, className = "", ...props }: TextareaProps) {
  return (
    <label className="grid w-full min-w-0 gap-2 text-sm font-medium text-[var(--text-primary)]">
      {(label || hint) && (
        <span className="flex items-center justify-between gap-3">
          {label}
          {hint && <span className="text-xs text-[var(--text-tertiary)]">{hint}</span>}
        </span>
      )}
      <textarea className={`input-base min-h-24 resize-none ${className}`} {...props} />
      {error && <span className="text-xs font-medium text-[#FF4D6D]">{error}</span>}
    </label>
  );
}

