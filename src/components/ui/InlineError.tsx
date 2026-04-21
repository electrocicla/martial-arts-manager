/**
 * InlineError — per-section error state with retry.
 * Replaces page-takeover "Dashboard Error" cards.
 */
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Surface } from './Surface';
import { cn } from '../../lib/utils';

export interface InlineErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function InlineError({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  className,
}: InlineErrorProps) {
  return (
    <Surface variant="outline" radius="md" className={cn('p-4 md:p-5 border-[var(--color-strike-500)]/40 bg-[var(--color-strike-900)]/10', className)} role="alert" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-strike-900)]/30 text-[var(--color-strike-400)]" aria-hidden>
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink-primary)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--color-ink-secondary)]">{message}</p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-strike-500)] hover:bg-[var(--color-strike-600)] active:bg-[var(--color-strike-700)] px-3 py-1.5 text-sm font-semibold text-white transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
            {retryLabel}
          </button>
        ) : null}
      </div>
    </Surface>
  );
}
