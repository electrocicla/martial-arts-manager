/**
 * Button Component - Premium, accessible button system with multiple variants
 * Designed for the Martial Arts Manager dark-theme aesthetic.
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  /** Size of the button */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Shows a spinner and disables the button */
  isLoading?: boolean;
  /** Icon rendered to the left of the label */
  leftIcon?: ReactNode;
  /** Icon rendered to the right of the label */
  rightIcon?: ReactNode;
  /** Stretch to fill the parent's full width */
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    /* ─── Size tokens ─────────────────────────────────────────────── */
    const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
      xs:  'px-2.5 py-1.5 text-xs  rounded-md  gap-1',
      sm:  'px-3.5  py-2   text-sm  rounded-lg  gap-1.5',
      md:  'px-5    py-2.5 text-sm  rounded-xl  gap-2',
      lg:  'px-6    py-3   text-base rounded-xl  gap-2',
      xl:  'px-8    py-3.5 text-lg  rounded-2xl gap-2.5',
    };

    /* ─── Variant tokens ──────────────────────────────────────────── */
    const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: [
        'bg-gradient-to-br from-red-500 to-red-700 text-white font-semibold',
        'shadow-md shadow-red-900/40',
        'hover:from-red-400 hover:to-red-600 hover:shadow-lg hover:shadow-red-800/50',
        'active:scale-[0.97] active:shadow-sm',
        'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
        'border border-red-600/50',
      ].join(' '),

      secondary: [
        'bg-gray-800 text-gray-100 font-semibold',
        'border border-gray-700',
        'shadow-sm shadow-black/30',
        'hover:bg-gray-700 hover:border-gray-600 hover:shadow-md',
        'active:scale-[0.97]',
        'focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      outline: [
        'bg-transparent text-red-400 font-semibold',
        'border-2 border-red-600/70',
        'hover:bg-red-600/10 hover:border-red-500 hover:text-red-300',
        'active:scale-[0.97]',
        'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      ghost: [
        'bg-transparent text-gray-400 font-medium',
        'hover:bg-gray-800/70 hover:text-gray-200',
        'active:scale-[0.97]',
        'focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      danger: [
        'bg-gradient-to-br from-red-700 to-rose-800 text-white font-semibold',
        'shadow-md shadow-red-950/50',
        'border border-red-700/60',
        'hover:from-red-600 hover:to-rose-700 hover:shadow-lg',
        'active:scale-[0.97] active:shadow-sm',
        'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      success: [
        'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-semibold',
        'shadow-md shadow-emerald-900/40',
        'border border-emerald-600/50',
        'hover:from-emerald-400 hover:to-emerald-600 hover:shadow-lg',
        'active:scale-[0.97]',
        'focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),

      warning: [
        'bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold',
        'shadow-md shadow-amber-900/40',
        'border border-amber-600/50',
        'hover:from-amber-400 hover:to-orange-500 hover:shadow-lg',
        'active:scale-[0.97]',
        'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
      ].join(' '),
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          /* base */
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'select-none cursor-pointer',
          'focus:outline-none',
          /* size */
          sizeClasses[size ?? 'md'],
          /* variant */
          variantClasses[variant ?? 'primary'],
          /* states */
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          isLoading  && 'cursor-wait',
          /* width */
          fullWidth  && 'w-full',
          className,
        )}
        {...props}
      >
        {/* Spinner */}
        {isLoading && (
          <svg
            className="w-4 h-4 animate-spin flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {leftIcon && !isLoading && (
          <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>
        )}

        {children}

        {rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
