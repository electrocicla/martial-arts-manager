/**
 * Section — standardized header + body wrapper used inside dashboard pages.
 * <Section title="Today" actions={<Button>…</Button>}>...</Section>
 */
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  /** Heading level for a11y. Default 2. */
  level?: 1 | 2 | 3;
}

export function Section({
  title,
  description,
  icon,
  actions,
  className,
  bodyClassName,
  children,
  level = 2,
}: SectionProps) {
  const Heading = (`h${level}` as unknown) as 'h2';
  return (
    <section className={cn('space-y-3', className)}>
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Heading className="flex items-center gap-2 text-base md:text-lg font-bold tracking-tight text-[var(--color-ink-primary)]">
            {icon ? <span className="text-[var(--color-strike-500)]" aria-hidden>{icon}</span> : null}
            <span className="truncate">{title}</span>
          </Heading>
          {description ? (
            <p className="mt-0.5 text-xs md:text-sm text-[var(--color-ink-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
