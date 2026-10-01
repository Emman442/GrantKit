import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'danger' | 'info';
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ type: 'success', title, message }),
    [toast]
  );

  const error = useCallback(
    (message: string, title?: string) => toast({ type: 'danger', title, message }),
    [toast]
  );

  const info = useCallback(
    (message: string, title?: string) => toast({ type: 'info', title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container: small, bottom-right, bordered, no colored backgrounds */}
      <aside aria-label="Notifications" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-raised)] text-[var(--text-app)] shadow-sm text-sm"
          >
            {t.type === 'success' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mt-1.5 shrink-0" />
            )}
            {t.type === 'danger' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)] mt-1.5 shrink-0" />
            )}
            {t.type === 'info' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <div className="font-semibold text-xs text-[var(--text-app)] mb-0.5">
                  {t.title}
                </div>
              )}
              <div className="text-xs text-[var(--text-muted)] leading-relaxed break-words">
                {t.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[var(--text-faint)] hover:text-[var(--text-app)] p-0.5 shrink-0 transition-colors"
              aria-label="Dismiss toast"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
