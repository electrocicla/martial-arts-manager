/**
 * CountUp — animated numeric counter using Framer Motion.
 * Reduced-motion: renders the final value immediately.
 */
import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { usePrefersReducedMotion } from '../../../lib/useBreakpoint';

export interface CountUpProps {
  value: number;
  /** Duration in seconds. */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const formatter = (decimals: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export function CountUp({ value, duration = 1.0, decimals = 0, prefix = '', suffix = '', className }: CountUpProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const fmt = formatter(decimals);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced || !inView) {
      node.textContent = `${prefix}${fmt.format(value)}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${prefix}${fmt.format(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [value, duration, decimals, prefix, suffix, reduced, inView, fmt]);

  return <span ref={ref} className={className}>{prefix}{fmt.format(reduced ? value : 0)}{suffix}</span>;
}
