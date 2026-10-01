import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${maxWidth} rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-app)] shadow-[0_8px_30px_rgb(0,0,0,0.45)] overflow-hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-app)]">
          <div>
            <h3 id="modal-title" className="text-sm font-semibold text-[var(--text-app)]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)] transition-colors"
            aria-label="Close dialog"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 text-xs text-[var(--text-app)]">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
