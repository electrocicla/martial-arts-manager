/**
 * Sheet — bottom sheet for mobile detail views. Replaces full Modal on small screens.
 * Drag-to-dismiss via Framer Motion. Focus-trapped. Esc to close.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePrefersReducedMotion } from '../../lib/useBreakpoint';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Show a top drag handle. Default true. */
  draggable?: boolean;
  /** Close on backdrop click. Default true. */
  dismissable?: boolean;
  className?: string;
  /** A11y label when no visible title. */
  ariaLabel?: string;
}

const DRAG_DISMISS_PX = 120;

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  draggable = true,
  dismissable = true,
  className,
  ariaLabel,
}: SheetProps) {
  const reduced = usePrefersReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // focus the sheet shell
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastActiveRef.current?.focus?.();
    };
  }, [open, dismissable, onClose]);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > DRAG_DISMISS_PX || info.velocity.y > 600) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={ariaLabel ?? title}>
          <motion.button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={() => dismissable && onClose()}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          />
          <motion.div
            ref={sheetRef}
            tabIndex={-1}
            drag={draggable && !reduced ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.6 }}
            className={cn(
              'relative z-10 w-full max-w-2xl bg-[var(--color-surface-1)] text-[var(--color-ink-primary)]',
              'rounded-t-[var(--radius-xl)] border border-b-0 border-[var(--color-border)]',
              'shadow-[var(--shadow-pop)]',
              'pb-[max(env(safe-area-inset-bottom),16px)]',
              className
            )}
            style={{ touchAction: draggable ? 'pan-y' : 'auto' }}
          >
            {draggable ? (
              <div className="flex justify-center pt-2 pb-1" aria-hidden>
                <div className="h-1 w-10 rounded-full bg-[var(--color-strike-500)]/70" />
              </div>
            ) : null}

            {(title || description) ? (
              <header className="flex items-start justify-between gap-3 px-5 pt-2 pb-3">
                <div className="min-w-0">
                  {title ? <h2 className="text-base md:text-lg font-bold truncate">{title}</h2> : null}
                  {description ? <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{description}</p> : null}
                </div>
                {dismissable ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="focus-ring -mr-1 -mt-1 grid h-9 w-9 place-items-center rounded-full text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                ) : null}
              </header>
            ) : null}

            <div className="px-5 pb-2 max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
