import { useToastContext } from '../components/ui/toastContext';

type ToastCallOptions = { description?: string; title?: string; duration?: number } | string | undefined;

const normalize = (a: string, b?: ToastCallOptions, c?: number) => {
  // Accept call forms used across the codebase:
  // 1) show('message')
  // 2) show('message', 'title')
  // 3) show('title', { description: 'message' })
  let title: string | undefined;
  let message = '';
  let duration: number | undefined;

  if (typeof b === 'string') {
    // form (message, title)
    message = a;
    title = b;
    duration = c;
  } else if (b && typeof b === 'object') {
    // form (title, { description, duration })
    title = a;
    message = b.description ?? '';
    duration = b.duration;
    if (b.title) title = b.title;
  } else {
    // form (message)
    message = a;
  }

  return { message, title, duration };
};

export const useToast = () => {
  const ctx = useToastContext();

  return {
    success: (a: string, b?: ToastCallOptions, c?: number) => {
      const { message, title, duration } = normalize(a, b, c);
      return ctx.push({ type: 'success', message, title, duration });
    },
    error: (a: string, b?: ToastCallOptions, c?: number) => {
      const { message, title, duration } = normalize(a, b, c);
      return ctx.push({ type: 'error', message, title, duration });
    },
    info: (a: string, b?: ToastCallOptions, c?: number) => {
      const { message, title, duration } = normalize(a, b, c);
      return ctx.push({ type: 'info', message, title, duration });
    },
    warn: (a: string, b?: ToastCallOptions, c?: number) => {
      const { message, title, duration } = normalize(a, b, c);
      return ctx.push({ type: 'warning', message, title, duration });
    },
    dismiss: (id: string) => ctx.dismiss(id),
  };
};

export default useToast;
// End of file - custom hook exported above