import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    inputSize = 'md',
    type = 'text',
    disabled,
    required,
    ...props 
  }, ref) => {
    // Base styles following Tailwind best practices
    const baseStyles = 'w-full rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    // Size variants
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg'
    };
    
    // Variant styles with proper state handling
    const variantStyles = {
      default: `
        border border-gray-300 bg-white text-gray-900 placeholder-gray-500
        hover:border-gray-400 focus:border-indigo-500 focus:ring-indigo-500
        dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
        dark:hover:border-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400
      `,
      filled: `
        border-0 bg-gray-100 text-gray-900 placeholder-gray-500
        hover:bg-gray-200 focus:bg-white focus:ring-indigo-500
        dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
        dark:hover:bg-gray-600 dark:focus:bg-gray-800 dark:focus:ring-indigo-400
      `,
      outlined: `
        border-2 border-gray-200 bg-transparent text-gray-900 placeholder-gray-500
        hover:border-gray-300 focus:border-indigo-500 focus:ring-indigo-500
        dark:border-gray-600 dark:text-white dark:placeholder-gray-400
        dark:hover:border-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400
      `
    };
    
    // Error state styles
    const errorStyles = error ? `
      border-red-500 focus:border-red-500 focus:ring-red-500
      dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400
    ` : '';
    
    const inputClasses = [
      baseStyles,
      sizeStyles[inputSize],
      variantStyles[variant],
      errorStyles,
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className
    ].join(' ').replace(/\s+/g, ' ').trim();

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="h-5 w-5 text-gray-400">{leftIcon}</div>
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            required={required}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${props.id}-error` : 
              helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="h-5 w-5 text-gray-400">{rightIcon}</div>
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${props.id}-error`} className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };