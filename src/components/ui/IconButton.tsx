/**
 * IconButton – a circular / square button that holds a single icon.
 * Ideal for close buttons, action row icons, toggle controls, etc.
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon to render inside the button */
  children: ReactNode;
  /**
   * Visual intent:
   * - `default`  → subtle gray background
   * - `ghost`    → no background, just hover glow
   * - `danger`   → red tint on hover
   * - `primary`  → brand red fill
   */
  variant?: 'default' | 'ghost' | 'danger' | 'primary';
  /** Physical size of the hit-area */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Use `rounded-lg` instead of `rounded-full` for a square look */
  shape?: 'circle' | 'square';
  /** Descriptive label for screen-readers (required when no visible text) */
  'aria-label': string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      shape = 'circle',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    /* ─── Size tokens ───────────────────────────────────────────── */
    const sizeClasses: Record<NonNullable<IconButtonProps['size']>, string> = {
      xs: 'w-6  h-6  [&>svg]:w-3 [&>svg]:h-3 [&>*]:w-3 [&>*]:h-3',
      sm: 'w-8  h-8  [&>svg]:w-4 [&>svg]:h-4 [&>*]:w-4 [&>*]:h-4',
      md: 'w-9  h-9  [&>svg]:w-4 [&>svg]:h-4 [&>*]:w-4 [&>*]:h-4',
      lg: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5 [&>*]:w-5 [&>*]:h-5',
    };

    /* ─── Variant tokens ────────────────────────────────────────── */
    const variantClasses: Record<NonNullable<IconButtonProps['variant']>, string> = {
      default: [
        'text-gray-400 bg-gray-800/80 border border-gray-700/60',
        'hover:bg-gray-700 hover:text-gray-100 hover:border-gray-600',
        'focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      ghost: [
        'text-gray-400 bg-transparent',
        'hover:bg-gray-800/70 hover:text-gray-100',
        'focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      danger: [
        'text-gray-400 bg-transparent',
        'hover:bg-red-600/15 hover:text-red-400 hover:border-red-700/40',
        'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      primary: [
        'text-white bg-gradient-to-br from-red-500 to-red-700',
        'shadow-sm shadow-red-900/40 border border-red-600/50',
        'hover:from-red-400 hover:to-red-600 hover:shadow-md',
        'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),
    };

    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center flex-shrink-0',
          'transition-all duration-150 ease-out',
          'select-none cursor-pointer',
          'focus:outline-none',
          sizeClasses[size ?? 'md'],
          variantClasses[variant ?? 'default'],
          shapeClass,
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          'active:scale-[0.94]',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
