import React, { useCallback, useMemo, useState } from 'react';
import type { Toast } from './toastTypes';
import { ToastContext } from './toastContext';

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: Toast = { id, ...t, duration: t.duration ?? 4000 };
    setToasts((s) => [toast, ...s]);
    // auto-dismiss
    setTimeout(() => {
      setToasts((s) => s.filter(x => x.id !== id));
    }, toast.duration);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((s) => s.filter(t => t.id !== id));
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toaster UI - mobile-first: bottom full-width on small screens, top-right on larger */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-end sm:items-start sm:justify-end p-4">
        <div className="w-full sm:w-auto flex flex-col gap-2 max-h-[90vh] overflow-auto">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto w-full sm:w-[360px] p-3 rounded-lg shadow-lg transform transition-all duration-200 border border-gray-700/50 bg-gradient-to-br from-gray-900 to-gray-800 flex items-start gap-3`}
              role="status"
              aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            >
              <div className="flex-0 mt-0.5">
                {t.type === 'success' && <span className="text-green-400">✓</span>}
                {t.type === 'error' && <span className="text-red-400">✕</span>}
                {t.type === 'info' && <span className="text-blue-400">i</span>}
                {t.type === 'warning' && <span className="text-yellow-400">!</span>}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && <div className="font-semibold text-sm text-white truncate">{t.title}</div>}
                <div className="text-xs text-gray-300 truncate">{t.message}</div>
              </div>
              <div className="flex-0">
                <button onClick={() => dismiss(t.id)} className="btn btn-ghost btn-sm btn-circle">×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
