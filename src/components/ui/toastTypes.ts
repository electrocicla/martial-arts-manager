export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms
}

export interface ToastContextValue {
  push: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}


