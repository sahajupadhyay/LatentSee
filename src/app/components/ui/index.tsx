import React from 'react';

/**
 * Loading Spinner Component
 * 
 * Accessible loading indicator with proper ARIA attributes
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  message = 'Loading...'
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        <svg 
          className={`animate-spin text-blue-500 ${sizeClasses[size]}`}
          fill="none" 
          viewBox="0 0 24 24"
          role="status"
          aria-label={message}
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
        {message && (
          <span className="text-sm text-gray-400" aria-live="polite">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Button Component with Loading State
 * 
 * Accessible button with loading state, proper focus management,
 * and keyboard navigation support
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
  secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400'
};

const sizeButtonClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  children,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md
        text-white
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeButtonClasses[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      aria-disabled={isDisabled}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" message="" />}
      {isLoading ? loadingText : children}
    </button>
  );
};

/**
 * Card Component
 * 
 * Reusable card container with consistent styling
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

/**
 * Alert Component
 * 
 * Accessible alert component for displaying messages
 */

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const alertClasses = {
  success: 'bg-green-900/20 border-green-500 text-green-400',
  error: 'bg-red-900/20 border-red-500 text-red-400',
  warning: 'bg-yellow-900/20 border-yellow-500 text-yellow-400',
  info: 'bg-blue-900/20 border-blue-500 text-blue-400'
};

export const Alert: React.FC<AlertProps> = ({ 
  type, 
  title, 
  children, 
  onDismiss, 
  className = '' 
}) => {
  return (
    <div 
      className={`border rounded-lg p-4 ${alertClasses[type]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-2">{title}</h4>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-current hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
            aria-label="Dismiss alert"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};