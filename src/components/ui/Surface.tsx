/**
 * Surface — base container primitive for the v2 design system.
 * Replaces ad-hoc <div class="bg-gray-800 rounded …">.
 *
 * Variants:
 *   - flat:    no border, no shadow (use inside other surfaces)
 *   - raised:  1px border + soft shadow (default card)
 *   - outline: 1px stronger border, no shadow (form sections)
 *   - strike:  red-bordered emphasis (for primary CTAs / important blocks)
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type SurfaceVariant = 'flat' | 'raised' | 'outline' | 'strike';
export type SurfaceTone = 'base' | 'elevated';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  tone?: SurfaceTone;
  /** Apply rounded corners. Default md. */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Render as <section> for semantic landmarks. */
  as?: 'div' | 'section' | 'article' | 'aside';
}

const radiusMap: Record<NonNullable<SurfaceProps['radius']>, string> = {
  none: 'rounded-none',
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  xl: 'rounded-[var(--radius-xl)]',
};

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { variant = 'raised', tone = 'base', radius = 'md', as: Tag = 'div', className, children, ...rest },
  ref
) {
  const bg = tone === 'elevated' ? 'bg-[var(--color-surface-2)]' : 'bg-[var(--color-surface-1)]';

  const variantClass: Record<SurfaceVariant, string> = {
    flat: '',
    raised: 'border border-[var(--color-border)] shadow-[var(--shadow-card)]',
    outline: 'border border-[var(--color-border-strong)]',
    strike: 'border border-[var(--color-strike-500)] shadow-[var(--shadow-strike)]',
  };

  return (
    <Tag
      ref={ref as never}
      className={cn(bg, radiusMap[radius], variantClass[variant], 'text-[var(--color-ink-primary)]', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
});
