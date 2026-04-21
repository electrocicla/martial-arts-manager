/**
 * EmptyState — disciplined empty-state primitive.
 * Used everywhere there is no data, replaces ad-hoc one-line messages.
 */
import type { ReactNode } from 'react';
import { Surface } from './Surface';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Surface variant="raised" radius="md" className={cn('p-6 md:p-8', className)}>
      <div className="flex flex-col items-center text-center gap-3">
        {icon ? (
          <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]" aria-hidden>
            {icon}
          </div>
        ) : null}
        <h3 className="text-base font-semibold text-[var(--color-ink-primary)]">{title}</h3>
        {description ? (
          <p className="text-sm text-[var(--color-ink-secondary)] max-w-sm">{description}</p>
        ) : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </Surface>
  );
}
