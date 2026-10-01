import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--text-muted)] select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`h-[36px] px-3 text-xs bg-[var(--bg-surface)] border rounded-[8px] text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition-colors focus-visible:outline-2 focus-visible:outline-[#3B6CFF] focus-visible:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
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

Input.displayName = 'Input';
