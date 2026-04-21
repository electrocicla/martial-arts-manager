/**
 * DonutGauge — single-value donut chart for KPIs (e.g. attendance %).
 */
import { useId } from 'react';
import { cn } from '../../../lib/utils';

export interface DonutGaugeProps {
  /** 0..1 */
  value: number;
  size?: number;
  thickness?: number;
  /** Fill color (CSS color or var). */
  color?: string;
  /** Inner content (label). */
  children?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function DonutGauge({
  value,
  size = 56,
  thickness = 6,
  color = 'var(--color-strike-500)',
  children,
  className,
  ariaLabel,
}: DonutGaugeProps) {
  const id = useId();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg
        role="img"
        aria-label={ariaLabel ?? `${Math.round(clamped * 100)} percent`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 motion-reduce:transform-none"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <title id={`gauge-${id}`}>{Math.round(clamped * 100)}%</title>
      </svg>
      {children ? (
        <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-[var(--color-ink-primary)]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
