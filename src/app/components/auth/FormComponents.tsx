'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

/**
 * Authentication UI Components
 * 
 * Reusable, accessible form components designed specifically for authentication flows.
 * Uses the LatentSee design system with neural theme and consistent styling.
 */

// Input Field Props
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Password Input Props
interface PasswordInputProps extends Omit<InputFieldProps, 'type'> {
  showStrengthIndicator?: boolean;
}

// Auth Button Props
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// Checkbox Props
interface AuthCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
}

/**
 * Enhanced Input Field Component
 * 
 * Professional input with validation states, icons, and smooth animations
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helper, success, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success && !hasError);

    return (
      <div className="space-y-2">
        {/* Label */}
        <label 
          htmlFor={props.id || props.name}
          className="block text-sm font-medium text-neutral-200"
        >
          {label}
        </label>

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            {...props}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full px-3 py-3 
              ${leftIcon ? 'pl-10' : ''} 
              ${rightIcon ? 'pr-10' : ''}
              bg-primary-900/30 backdrop-blur-sm
              border rounded-xl
              text-white placeholder-neutral-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-primary-950
              disabled:opacity-50 disabled:cursor-not-allowed
              ${hasError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' 
                : hasSuccess 
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
                  : isFocused 
                    ? 'border-accent-500 focus:border-accent-500 focus:ring-accent-500/50'
                    : 'border-primary-700 hover:border-primary-600'
              }
              ${className}
            `}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}

          {/* Success/Error Icons */}
          <AnimatePresence>
            {(hasError || hasSuccess) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  rightIcon ? 'right-10' : 'right-3'
                }`}
              >
                {hasError ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Helper/Error Text */}
        <AnimatePresence>
          {(error || helper) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {error ? (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              ) : helper ? (
                <p className="text-sm text-neutral-400">{helper}</p>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

InputField.displayName = 'InputField';

/**
 * Password Input with Visibility Toggle
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrengthIndicator = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(0);

    // Calculate password strength
    const calculateStrength = (password: string) => {
      let score = 0;
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
      return score;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showStrengthIndicator) {
        setStrength(calculateStrength(e.target.value));
      }
      props.onChange?.(e);
    };

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return (
      <div className="space-y-2">
        <InputField
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          onChange={handlePasswordChange}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
        />

        {/* Password Strength Indicator */}
        {showStrengthIndicator && props.value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    level <= strength ? strengthColors[strength - 1] : 'bg-neutral-700'
                  }`}
                />
              ))}
            </div>
            {strength > 0 && (
              <p className={`text-xs ${
                strength <= 2 ? 'text-red-400' : 
                strength <= 3 ? 'text-yellow-400' : 
                'text-green-400'
              }`}>
                Password strength: {strengthLabels[strength - 1]}
              </p>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

/**
 * Styled Authentication Button
 */
export const AuthButton: React.FC<AuthButtonProps> = ({
  isLoading = false,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center
    font-medium rounded-xl transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-950
    disabled:opacity-50 disabled:cursor-not-allowed
    transform hover:scale-[1.02] active:scale-[0.98]
    ${isLoading ? 'cursor-wait' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-accent-500 to-accent-600 
      hover:from-accent-600 hover:to-accent-700 
      active:from-accent-700 active:to-accent-800
      text-white shadow-lg shadow-accent-500/25 
      hover:shadow-accent-500/40 hover:shadow-xl
      focus:ring-accent-500/50
      border border-accent-400/20
    `,
    secondary: `
      bg-gradient-to-r from-primary-700 to-primary-600 
      hover:from-primary-600 hover:to-primary-500 
      active:from-primary-800 active:to-primary-700
      text-white shadow-lg shadow-primary-500/25
      hover:shadow-primary-500/40 hover:shadow-xl
      focus:ring-primary-500/50
      border border-primary-500/20
    `,
    outline: `
      bg-transparent hover:bg-primary-800/50 active:bg-primary-700/50
      text-white border-2 border-primary-600 hover:border-primary-500
      focus:ring-primary-500/50 shadow-lg hover:shadow-xl
      backdrop-blur-sm
    `
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm h-9',
    md: 'px-6 py-3 text-sm h-11',
    lg: 'px-8 py-4 text-base h-12'
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
        />
      )}
      {children}
    </button>
  );
};

/**
 * Enhanced Checkbox Component
 */
export const AuthCheckbox: React.FC<AuthCheckboxProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            {...props}
            type="checkbox"
            className={`
              w-5 h-5 rounded border-2 bg-primary-900/30 backdrop-blur-sm
              text-accent-500 focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-0
              transition-all duration-200
              ${error ? 'border-red-500' : 'border-primary-600 group-hover:border-primary-500'}
              ${className}
            `}
          />
        </div>
        <div className="flex-1">
          <span className="text-sm text-neutral-200 group-hover:text-white transition-colors">
            {label}
          </span>
        </div>
      </label>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-red-400 flex items-center gap-2 ml-8">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Form Container Component
 */
interface AuthFormProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  children,
  title,
  subtitle,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full max-w-md mx-auto ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl font-heading font-bold text-white mb-3"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-neutral-400 text-sm"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Form Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * Auth Link Component
 */
interface AuthLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const AuthLink: React.FC<AuthLinkProps> = ({
  href,
  children,
  className = ''
}) => {
  return (
    <a
      href={href}
      className={`
        inline-flex items-center text-sm text-accent-400 hover:text-accent-300
        transition-colors duration-200 underline-offset-4 hover:underline
        focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2 
        focus:ring-offset-primary-950 rounded-sm
        ${className}
      `}
    >
      {children}
    </a>
  );
};