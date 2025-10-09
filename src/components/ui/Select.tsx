import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
  variant?: 'default' | 'filled' | 'outlined';
  selectSize?: 'sm' | 'md' | 'lg';
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className = '',
    label,
    error,
    helperText,
    placeholder,
    options,
    variant = 'default',
    selectSize = 'md',
    disabled,
    required,
    ...props
  }, ref) => {
    // Base styles with proper focus states and transitions
    const baseStyles = `
      w-full appearance-none rounded-lg font-medium transition-colors duration-200 
      focus:outline-none focus:ring-2 focus:ring-offset-2 
      disabled:cursor-not-allowed disabled:opacity-50
      bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMCAyMCI+PHBhdGggc3Ryb2tlPSIjNjI3NTk0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJtNiA4IDQgNCA0LTQiLz48L3N2Zz4=')]
      bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat
    `;
    
    // Size variants
    const sizeStyles = {
      sm: 'px-3 py-2 pr-10 text-sm',
      md: 'px-4 py-2.5 pr-12 text-base',
      lg: 'px-5 py-3 pr-14 text-lg'
    };
    
    // Variant styles with comprehensive state management
    const variantStyles = {
      default: `
        border border-gray-300 bg-white text-gray-900
        hover:border-gray-400 focus:border-indigo-500 focus:ring-indigo-500
        dark:border-gray-600 dark:bg-gray-800 dark:text-white
        dark:hover:border-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400
      `,
      filled: `
        border-0 bg-gray-100 text-gray-900
        hover:bg-gray-200 focus:bg-white focus:ring-indigo-500
        dark:bg-gray-700 dark:text-white
        dark:hover:bg-gray-600 dark:focus:bg-gray-800 dark:focus:ring-indigo-400
      `,
      outlined: `
        border-2 border-gray-200 bg-transparent text-gray-900
        hover:border-gray-300 focus:border-indigo-500 focus:ring-indigo-500
        dark:border-gray-600 dark:text-white
        dark:hover:border-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400
      `
    };
    
    // Error state styles
    const errorStyles = error ? `
      border-red-500 focus:border-red-500 focus:ring-red-500
      dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400
    ` : '';
    
    const selectClasses = [
      baseStyles,
      sizeStyles[selectSize],
      variantStyles[variant],
      errorStyles,
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
          <select
            ref={ref}
            disabled={disabled}
            required={required}
            className={selectClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${props.id}-error` : 
              helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
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

Select.displayName = 'Select';

export { Select };