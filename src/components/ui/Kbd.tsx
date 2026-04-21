/**
 * Kbd — keyboard shortcut chip. Disciplined, monospace.
 * Usage: <Kbd>⌘</Kbd><Kbd>K</Kbd>
 */
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-[6px] border px-1 font-mono text-[10px] font-semibold leading-none',
        'border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)]',
        className
      )}
    >
      {children}
    </kbd>
  );
}
