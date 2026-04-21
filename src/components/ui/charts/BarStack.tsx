/**
 * BarStack — small stacked-bar SVG chart (e.g. paid vs pending vs overdue).
 */
import { useId, useMemo } from 'react';
import { cn } from '../../../lib/utils';

export interface BarStackSeries {
  label: string;
  value: number;
  color: string;
}

export interface BarStackProps {
  data: BarStackSeries[];
  width?: number;
  height?: number;
  className?: string;
  showLegend?: boolean;
}

export function BarStack({ data, width = 220, height = 12, className, showLegend = true }: BarStackProps) {
  const id = useId();
  const { segments, total } = useMemo(() => {
    const t = data.reduce((acc, s) => acc + Math.max(0, s.value), 0) || 1;
    let cursor = 0;
    const segs = data.map((s) => {
      const w = (Math.max(0, s.value) / t) * width;
      const seg = { ...s, x: cursor, w };
      cursor += w;
      return seg;
    });
    return { segments: segs, total: t };
  }, [data, width]);

  return (
    <div className={cn('w-full', className)}>
      <svg
        role="img"
        aria-label={data.map((s) => `${s.label} ${s.value}`).join(', ')}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <rect x="0" y="0" width={width} height={height} rx={height / 2} fill="var(--color-surface-3)" />
        <clipPath id={`barstack-${id}`}>
          <rect x="0" y="0" width={width} height={height} rx={height / 2} />
        </clipPath>
        <g clipPath={`url(#barstack-${id})`}>
          {segments.map((s) => (
            <rect key={s.label} x={s.x} y="0" width={s.w} height={height} fill={s.color} />
          ))}
        </g>
      </svg>
      {showLegend ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-ink-secondary)]">
          {data.map((s) => (
            <li key={s.label} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} aria-hidden />
              <span>{s.label}</span>
              <span className="font-semibold text-[var(--color-ink-primary)]">
                {Math.round((s.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
