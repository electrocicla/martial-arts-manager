/**
 * Button Component - Professional, accessible button with multiple variants
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
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
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      
      // Size variants
      {
        'px-3 py-2 text-sm rounded-md': size === 'sm',
        'px-4 py-2.5 text-sm rounded-lg': size === 'md',
        'px-6 py-3 text-base rounded-lg': size === 'lg',
      },
      
      // Color variants
      {
        // Primary
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md': 
          variant === 'primary' && !disabled,
        
        // Secondary
        'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300': 
          variant === 'secondary' && !disabled,
        
        // Outline
        'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500 border border-blue-600 hover:border-blue-700': 
          variant === 'outline' && !disabled,
        
        // Ghost
        'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500': 
          variant === 'ghost' && !disabled,
        
        // Danger
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md': 
          variant === 'danger' && !disabled,
      },
      
      // Full width
      fullWidth && 'w-full',
      
      // Loading state
      isLoading && 'cursor-wait',
    ];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseClasses, className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="w-4 h-4 mr-2 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {leftIcon && !isLoading && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        
        {children}
        
        {rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };