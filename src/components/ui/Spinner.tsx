/**
 * Spinner — disciplined loading indicator. Replaces DaisyUI `loading-spinner`.
 */
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Override color. Default = strike-500. */
  tone?: 'strike' | 'ink' | 'inherit';
  className?: string;
  label?: string;
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

export function Spinner({ size = 'md', tone = 'strike', className, label = 'Loading' }: SpinnerProps) {
  const colorClass =
    tone === 'strike'
      ? 'border-[var(--color-strike-500)]/30 border-t-[var(--color-strike-500)]'
      : tone === 'ink'
      ? 'border-[var(--color-ink-secondary)]/30 border-t-[var(--color-ink-primary)]'
      : 'border-current/30 border-t-current';
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block animate-spin rounded-full motion-reduce:animate-none', sizeMap[size], colorClass, className)}
    />
  );
}
