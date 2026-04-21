/**
 * Stat — the canonical KPI tile for the dashboard v2.
 *
 * <Stat
 *   label="Active Students"
 *   value={120}
 *   delta={+8}
 *   trend={[10,12,14,18,22,26,32]}
 *   icon={<Users />}
 * />
 */
import type { ReactNode } from 'react';
import { Surface } from './Surface';
import { Sparkline } from './charts/Sparkline';
import { CountUp } from './effects/CountUp';
import { PressableMotion } from './effects/Motion';
import { cn } from '../../lib/utils';

export interface StatProps {
  label: string;
  value: number | string;
  /** Optional change vs prior period — number => formatted with sign. */
  delta?: number;
  /** "up" | "down" | "flat" — overrides delta sign for color. */
  trendDirection?: 'up' | 'down' | 'flat';
  trend?: number[];
  icon?: ReactNode;
  /** Make tile interactive. */
  onClick?: () => void;
  href?: string;
  /** Suffix after value (e.g. "%"). */
  suffix?: string;
  /** Decimal precision when value is a number. Default 0. */
  decimals?: number;
  /** Hide the count-up animation (use for non-numeric or very fast updates). */
  staticValue?: boolean;
  className?: string;
  ariaLabel?: string;
}

function formatDelta(d: number): string {
  if (d === 0) return '0';
  const sign = d > 0 ? '+' : '';
  return `${sign}${d}`;
}

function deltaTone(direction: 'up' | 'down' | 'flat'): string {
  if (direction === 'up') return 'text-[var(--color-success)] bg-[color-mix(in_oklab,var(--color-success)_18%,transparent)]';
  if (direction === 'down') return 'text-[var(--color-strike-400)] bg-[color-mix(in_oklab,var(--color-strike-500)_18%,transparent)]';
  return 'text-[var(--color-ink-muted)] bg-[var(--color-surface-3)]';
}

export function Stat({
  label,
  value,
  delta,
  trendDirection,
  trend,
  icon,
  onClick,
  href,
  suffix = '',
  decimals = 0,
  staticValue = false,
  className,
  ariaLabel,
}: StatProps) {
  const direction: 'up' | 'down' | 'flat' =
    trendDirection ?? (delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat');

  const numeric = typeof value === 'number';

  const inner = (
    <Surface
      variant="raised"
      radius="md"
      className={cn('p-4 md:p-5 transition-colors duration-200', (onClick || href) && 'hover:border-[var(--color-strike-500)]/60', className)}
      aria-label={ariaLabel ?? label}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-muted)] truncate">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight text-[var(--color-ink-primary)]">
              {numeric && !staticValue ? (
                <CountUp value={value as number} decimals={decimals} suffix={suffix} />
              ) : (
                <>{value}{suffix}</>
              )}
            </span>
          </div>
          {delta != null ? (
            <span
              className={cn(
                'mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                deltaTone(direction)
              )}
            >
              {formatDelta(delta)}
            </span>
          ) : null}
        </div>
        {icon ? (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] text-[var(--color-strike-500)]" aria-hidden>
            {icon}
          </div>
        ) : null}
      </div>
      {trend && trend.length > 1 ? (
        <div className="mt-3">
          <Sparkline
            data={trend}
            width={140}
            height={28}
            stroke={direction === 'down' ? 'var(--color-strike-400)' : 'var(--color-strike-500)'}
            ariaLabel={`${label} trend`}
          />
        </div>
      ) : null}
    </Surface>
  );

  if (href) {
    return (
      <a href={href} className="focus-ring block rounded-[var(--radius-md)]">
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <PressableMotion onClick={onClick} className="focus-ring block w-full text-left rounded-[var(--radius-md)]">
        {inner}
      </PressableMotion>
    );
  }
  return inner;
}
