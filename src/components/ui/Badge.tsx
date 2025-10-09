import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className = '',
    variant = 'default',
    size = 'md',
    rounded = false,
    dot = false,
    children,
    ...props
  }, ref) => {
    // Base styles with proper typography and spacing
    const baseStyles = `
      inline-flex items-center font-medium transition-colors duration-200
      ${rounded ? 'rounded-full' : 'rounded-md'}
      ${dot ? 'h-2 w-2 p-0' : ''}
    `;
    
    // Size variants
    const sizeStyles = {
      sm: dot ? 'h-1.5 w-1.5' : 'px-2 py-0.5 text-xs',
      md: dot ? 'h-2 w-2' : 'px-2.5 py-1 text-sm',
      lg: dot ? 'h-3 w-3' : 'px-3 py-1.5 text-base'
    };
    
    // Variant styles with proper contrast ratios and dark mode support
    const variantStyles = {
      default: `
        bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-300
        dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600
      `,
      primary: `
        bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/10
        dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20
      `,
      secondary: `
        bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/10
        dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20
      `,
      success: `
        bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20
        dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20
      `,
      warning: `
        bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20
        dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20
      `,
      danger: `
        bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10
        dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20
      `,
      info: `
        bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10
        dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20
      `
    };
    
    const badgeClasses = [
      baseStyles,
      sizeStyles[size],
      variantStyles[variant],
      className
    ].join(' ').replace(/\s+/g, ' ').trim();

    if (dot) {
      return (
        <span
          ref={ref}
          className={badgeClasses}
          {...props}
        />
      );
    }

    return (
      <span
        ref={ref}
        className={badgeClasses}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };