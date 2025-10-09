import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'avatar' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number; // For text variant
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({
    variant = 'text',
    width,
    height,
    animation = 'pulse',
    lines = 1,
    className = '',
    style,
    ...props
  }, ref) => {
    // Base animation classes
    const animationStyles = {
      pulse: 'animate-pulse',
      wave: 'animate-pulse', // Can be enhanced with custom wave animation
      none: ''
    };
    
    // Variant-specific styles
    const variantStyles = {
      text: 'h-4 rounded-md',
      rectangular: 'rounded-lg',
      circular: 'rounded-full',
      avatar: 'h-10 w-10 rounded-full',
      card: 'h-48 w-full rounded-xl'
    };
    
    const baseStyles = `
      bg-gray-200 dark:bg-gray-700
      ${animationStyles[animation]}
      ${variantStyles[variant]}
    `;
    
    // Handle style prop with width/height
    const inlineStyles = {
      ...style,
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && { height: typeof height === 'number' ? `${height}px` : height })
    };
    
    const skeletonClasses = [baseStyles, className].join(' ').replace(/\s+/g, ' ').trim();

    // For text variant with multiple lines
    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className="space-y-2" {...props}>
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={`${skeletonClasses} ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
              style={inlineStyles}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={skeletonClasses}
        style={inlineStyles}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Predefined skeleton patterns
export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <Skeleton variant="text" lines={lines} className={className} />
);

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`space-y-4 ${className}`}>
    <Skeleton variant="rectangular" height={200} />
    <div className="space-y-2">
      <Skeleton variant="text" width="75%" />
      <Skeleton variant="text" width="50%" />
    </div>
  </div>
);

export const SkeletonProfile = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center space-x-4 ${className}`}>
    <Skeleton variant="avatar" />
    <div className="space-y-2 flex-1">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </div>
  </div>
);

export const SkeletonList = ({ 
  items = 5, 
  showAvatar = false, 
  className = '' 
}: { 
  items?: number; 
  showAvatar?: boolean; 
  className?: string; 
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className="flex items-center space-x-4">
        {showAvatar && <Skeleton variant="avatar" />}
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

export { Skeleton };