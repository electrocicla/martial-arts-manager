import { createContext, useContext } from 'react';
import type { ToastContextValue } from './toastTypes';

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
};

export default useToastContext;
