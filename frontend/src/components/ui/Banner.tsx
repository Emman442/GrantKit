import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface BannerProps {
  variant?: 'danger' | 'warning' | 'info' | 'success';
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  title,
  children,
  action,
  className = '',
}) => {
  let borderColor = 'border-[var(--border-app)]';
  let dotColor = 'bg-[var(--accent)]';
  let icon = <Info size={16} strokeWidth={1.5} className="text-[#3B6CFF] shrink-0 mt-0.5" />;

  switch (variant) {
    case 'danger':
      borderColor = 'border-[#D2554D]';
      dotColor = 'bg-[#D2554D]';
      icon = <AlertCircle size={16} strokeWidth={1.5} className="text-[#D2554D] shrink-0 mt-0.5" />;
      break;
    case 'warning':
      borderColor = 'border-[#C9932B]';
      dotColor = 'bg-[#C9932B]';
      icon = <AlertTriangle size={16} strokeWidth={1.5} className="text-[#C9932B] shrink-0 mt-0.5" />;
      break;
    case 'success':
      borderColor = 'border-[#2FA36B]';
      dotColor = 'bg-[#2FA36B]';
      icon = <CheckCircle size={16} strokeWidth={1.5} className="text-[#2FA36B] shrink-0 mt-0.5" />;
      break;
  }

  return (
    <div
      className={`rounded-[8px] border ${borderColor} bg-[var(--bg-surface)] p-4 flex items-start gap-3 text-xs leading-relaxed ${className}`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-semibold text-xs text-[var(--text-app)] mb-1">{title}</div>
        )}
        <div className="text-[var(--text-muted)]">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
