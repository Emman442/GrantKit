import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, maxLength, value, onChange, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-[var(--text-muted)] select-none"
            >
              {label}
            </label>
          )}
          {maxLength !== undefined && (
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-faint)]">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          id={inputId}
          ref={ref}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          className={`p-3 text-xs bg-[var(--bg-surface)] border rounded-[8px] text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition-colors resize-y min-h-[96px] focus-visible:outline-2 focus-visible:outline-[#3B6CFF] focus-visible:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-[#D2554D] focus-visible:outline-[#D2554D]'
              : 'border-[var(--border-app)] hover:border-[var(--text-faint)]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[11px] text-[#D2554D] leading-tight">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[var(--text-muted)] leading-tight">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
