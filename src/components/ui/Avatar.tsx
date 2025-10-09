import React, { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({
    src,
    alt = '',
    size = 'md',
    fallback,
    shape = 'circle',
    status,
    showStatus = false,
    className = '',
    ...props
  }, ref) => {
    // Size variants with consistent scaling
    const sizeStyles = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
      '2xl': 'h-20 w-20 text-2xl'
    };
    
    // Status dot sizes that scale with avatar size
    const statusSizes = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4',
      '2xl': 'h-5 w-5'
    };
    
    // Status colors with proper contrast
    const statusStyles = {
      online: 'bg-green-400 ring-white dark:ring-gray-800',
      offline: 'bg-gray-400 ring-white dark:ring-gray-800',
      away: 'bg-yellow-400 ring-white dark:ring-gray-800',
      busy: 'bg-red-400 ring-white dark:ring-gray-800'
    };
    
    const baseStyles = `
      relative inline-flex items-center justify-center overflow-hidden
      bg-gray-100 font-medium text-gray-600 ring-2 ring-white
      dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-800
      ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
    `;
    
    const avatarClasses = [
      baseStyles,
      sizeStyles[size],
      className
    ].join(' ').replace(/\s+/g, ' ').trim();

    // Generate fallback initials from alt text or fallback prop
    const getInitials = () => {
      const text = fallback || alt || '';
      return text
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div ref={ref} className={avatarClasses} {...props}>
        {src ? (
          <img
            src={src}
            alt={alt}
            className={`h-full w-full object-cover ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
            onError={(e) => {
              // Hide image on error, show fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="select-none">
            {getInitials() || '?'}
          </span>
        )}
        
        {/* Status indicator */}
        {showStatus && status && (
          <span
            className={`
              absolute bottom-0 right-0 block rounded-full ring-2
              ${statusSizes[size]} ${statusStyles[status]}
            `}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group component for overlapping avatars
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  spacing?: 'tight' | 'normal' | 'loose';
  children: React.ReactNode;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 5, spacing = 'normal', children, className = '', ...props }, ref) => {
    const spacingStyles = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-1'
    };
    
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = childrenArray.length - max;
    
    return (
      <div
        ref={ref}
        className={`flex items-center ${spacingStyles[spacing]} ${className}`}
        {...props}
      >
        {visibleChildren}
        {remainingCount > 0 && (
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-medium text-gray-600 ring-2 ring-white dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-800">
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar };