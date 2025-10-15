import { useToastContext } from '../components/ui/toastContext';

export const useToast = () => {
  const ctx = useToastContext();

  return {
    success: (message: string, title?: string, duration?: number) => ctx.push({ type: 'success', message, title, duration }),
    error: (message: string, title?: string, duration?: number) => ctx.push({ type: 'error', message, title, duration }),
    info: (message: string, title?: string, duration?: number) => ctx.push({ type: 'info', message, title, duration }),
    warn: (message: string, title?: string, duration?: number) => ctx.push({ type: 'warning', message, title, duration }),
    dismiss: (id: string) => ctx.dismiss(id),
  };
};

export default useToast;
// End of file - custom hook exported above