/**
 * TabButton – pill-shaped navigation tab button.
 * Used in Analytics, Settings, and any multi-section panel.
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether this tab is currently selected */
  isActive?: boolean;
  /** Optional icon to show before the label */
  icon?: ReactNode;
  /**
   * Color accent used for the active state pill:
   * - `red`     (default) → brand red gradient
   * - `blue`    → blue gradient
   * - `emerald` → green gradient
   */
  accent?: 'red' | 'blue' | 'emerald';
}

const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ isActive = false, icon, accent = 'red', children, className, disabled, ...props }, ref) => {
    const accentActive: Record<NonNullable<TabButtonProps['accent']>, string> = {
      red:     'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50 border border-red-600/50',
      blue:    'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 border border-blue-600/50',
      emerald: 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/50 border border-emerald-600/50',
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center gap-2',
          'px-4 py-2.5 rounded-lg text-sm font-semibold',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
          'select-none',
          isActive
            ? accentActive[accent]
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80 border border-transparent',
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          'active:scale-[0.97]',
          className,
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
        {children}
      </button>
    );
  }
);

TabButton.displayName = 'TabButton';

export { TabButton };
