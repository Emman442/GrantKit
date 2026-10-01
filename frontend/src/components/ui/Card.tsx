import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'raised';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  className = '',
  ...props
}) => {
  const bgClass =
    variant === 'raised' ? 'bg-[var(--bg-surface-raised)]' : 'bg-[var(--bg-surface)]';

  return (
    <div
      className={`rounded-[8px] border border-[var(--border-app)] ${bgClass} p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
