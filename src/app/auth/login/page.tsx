'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/lib/auth';
import { LoginFormData, LoginSchema } from '@/lib/auth/types';
import { Squares } from '@/app/components/ui';
import { PublicRoute } from '@/app/components/auth';
import { 
  AuthForm, 
  InputField, 
  PasswordInput, 
  AuthButton, 
  AuthCheckbox, 
  AuthLink 
} from '@/app/components/auth/FormComponents';

/**
 * Login Page Component
 * 
 * Professional login form with comprehensive validation, error handling,
 * and smooth animations. Integrates with the LatentSee authentication system.
 */

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const message = searchParams.get('message');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setIsRedirecting(true);
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  // Clear errors when user starts typing
  useEffect(() => {
    clearError();
    setSubmitError(null);
    setFormErrors({});
  }, [formData.email, formData.password, clearError]);

  /**
   * Validate form data
   */
  const validateForm = (data: LoginFormData): Partial<Record<keyof LoginFormData, string>> => {
    const errors: Partial<Record<keyof LoginFormData, string>> = {};
    
    // Validate with Zod schema
    const result = LoginSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
    }
    
    return errors;
  };

  /**
   * Handle input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitError(null);
      setFormErrors({});

      // Validate form
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const response = await signIn(formData);

      if (response.success) {
        setIsRedirecting(true);
        
        // Small delay for better UX
        setTimeout(() => {
          router.push(response.redirectTo || redirectTo);
        }, 500);
      } else if (response.error) {
        // Handle specific error types
        if (response.error.code === 'Invalid login credentials') {
          setFormErrors({
            email: 'Invalid email or password',
            password: ' ' // Space to trigger error state styling
          });
        } else {
          setSubmitError(response.error.message);
        }
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  // Show loading screen if redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-neutral-300">Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <Squares 
          speed={0.3} 
          squareSize={60}
          direction="diagonal"
          borderColor="rgba(100, 116, 139, 0.1)"
          hoverFillColor="rgba(100, 116, 139, 0.05)"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back to Home Link */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Back to LatentSee
            </Link>
          </motion.div>

          {/* Welcome Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
              >
                <p className="text-sm text-blue-300 text-center">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-8 shadow-2xl"
          >
            <AuthForm 
              title="Welcome Back"
              subtitle="Sign in to access your neural dashboard"
            >
              {/* Global Error Message */}
              <AnimatePresence>
                {(submitError || error) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-300">
                        {submitError || error}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <InputField
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  label="Email Address"
                  placeholder="Enter your email"
                  error={formErrors.email}
                  leftIcon={<Mail className="w-5 h-5" />}
                  autoComplete="email"
                  autoFocus
                />

                {/* Password Field */}
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  label="Password"
                  placeholder="Enter your password"
                  error={formErrors.password}
                  autoComplete="current-password"
                />

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <AuthCheckbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    label="Remember me for 30 days"
                  />
                  
                  <AuthLink href="/auth/forgot-password">
                    Forgot password?
                  </AuthLink>
                </div>

                {/* Submit Button */}
                <AuthButton
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </AuthButton>
              </form>

              {/* Divider */}
              <div className="my-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-primary-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-primary-900/50 text-neutral-400">
                      New to LatentSee?
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-neutral-400">
                  Don't have an account?{' '}
                  <AuthLink href="/auth/signup">
                    Create one now
                  </AuthLink>
                </p>
              </div>
            </AuthForm>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-neutral-500">
              By signing in, you agree to our{' '}
              <AuthLink href="/terms" className="text-xs">
                Terms of Service
              </AuthLink>{' '}
              and{' '}
              <AuthLink href="/privacy" className="text-xs">
                Privacy Policy
              </AuthLink>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Login Page with Public Route Protection
 */
export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginPageContent />
    </PublicRoute>
  );
}