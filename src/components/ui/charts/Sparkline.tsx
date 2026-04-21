/**
 * Sparkline — pure SVG mini-chart used inside Stat / dashboard cards.
 * No external chart deps. Optional area fill. Reduced-motion: no draw animation.
 */
import { useId, useMemo } from 'react';
import { cn } from '../../../lib/utils';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Stroke color (CSS color or var). Default: --color-strike-500. */
  stroke?: string;
  /** Fill area under line. */
  fill?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  stroke = 'var(--color-strike-500)',
  fill = true,
  className,
  ariaLabel,
}: SparklineProps) {
  const id = useId();
  const { d, area, last } = useMemo(() => {
    if (!data.length) return { d: '', area: '', last: { x: 0, y: height / 2 } };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = data.length > 1 ? width / (data.length - 1) : width;
    const points = data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return [x, y] as const;
    });
    const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const areaPath = `${path} L${width},${height} L0,${height} Z`;
    return { d: path, area: areaPath, last: { x: points[points.length - 1][0], y: points[points.length - 1][1] } };
  }, [data, width, height]);

  if (!data.length) return null;

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? 'sparkline'}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={`sparkfill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#sparkfill-${id})`} />
        </>
      ) : null}
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={1.75} fill={stroke} />
    </svg>
  );
}
