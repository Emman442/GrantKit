import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium text-xs rounded-[6px] transition-colors duration-120 select-none whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

  const sizeClasses = size === 'sm' ? 'h-[30px] px-3' : 'h-[36px] px-4';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-[#3B6CFF] text-white hover:bg-[#2F58D6] active:bg-[#2647B0] disabled:hover:bg-[#3B6CFF]';
      break;
    case 'secondary':
      variantClasses =
        'bg-transparent border border-[var(--border-app)] text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)] active:bg-[var(--border-app)]';
      break;
    case 'danger':
      variantClasses =
        'bg-[#D2554D] text-white hover:bg-[#B8423B] active:bg-[#9E342E] disabled:hover:bg-[#D2554D]';
      break;
    case 'ghost':
      variantClasses =
        'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)]';
      break;
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
