import { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    title,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
    showCloseButton = true,
    children,
    className = '',
    ...props
  }, ref) => {
    // Handle escape key
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    // Handle backdrop click
    const handleBackdropClick = (event: React.MouseEvent) => {
      if (closeOnBackdrop && event.target === event.currentTarget) {
        onClose();
      }
    };

    // Size variants with proper responsive behavior
    const sizeStyles = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Backdrop with proper dark mode support */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        
        {/* Modal container with animation */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className={`
            relative w-full ${sizeStyles[size]} transform rounded-xl bg-gray-800 border border-gray-700 
            shadow-2xl transition-all duration-300 animate-in zoom-in-95
            dark:bg-gray-800 dark:shadow-gray-900/50 ${className}
          `}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </h2>
              )}
              
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    rounded-lg p-2 text-gray-400 transition-colors duration-200
                    hover:bg-gray-700 hover:text-gray-300 focus:outline-none
                    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                    dark:hover:bg-gray-700 dark:hover:text-gray-300
                    dark:focus:ring-indigo-400 dark:focus:ring-offset-gray-800
                  "
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Modal subcomponents for better composition
export const ModalHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`border-b border-gray-200 px-6 py-4 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

export const ModalBody = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`border-t border-gray-200 px-6 py-4 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

export { Modal };