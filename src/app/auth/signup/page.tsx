'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/lib/auth';
import { SignupFormData, SignupSchema } from '@/lib/auth/types';
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
 * Signup Page Component
 * 
 * Professional signup form with comprehensive validation, password strength
 * indicator, terms acceptance, and smooth animations.
 */

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptTerms: false
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
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
  }, [formData.email, formData.password, formData.name, clearError]);

  /**
   * Validate form data
   */
  const validateForm = (data: SignupFormData): Partial<Record<keyof SignupFormData, string>> => {
    const errors: Partial<Record<keyof SignupFormData, string>> = {};
    
    // Validate with Zod schema
    const result = SignupSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof SignupFormData] = err.message;
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

      const response = await signUp(formData);

      if (response.success) {
        setIsRedirecting(true);
        
        // Small delay for better UX
        setTimeout(() => {
          router.push(response.redirectTo || redirectTo);
        }, 500);
      } else if (response.error) {
        // Handle specific error types
        if (response.error.code === 'User already registered') {
          setFormErrors({
            email: 'An account with this email already exists. Try signing in instead.'
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
          <p className="text-neutral-300">Creating your account...</p>
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

          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-8 shadow-2xl"
          >
            <AuthForm 
              title="Join LatentSee"
              subtitle="Create your account to start exploring neural patterns"
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
                {/* Name Field */}
                <InputField
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  label="Full Name"
                  placeholder="Enter your full name"
                  error={formErrors.name}
                  leftIcon={<User className="w-5 h-5" />}
                  autoComplete="name"
                  autoFocus
                />

                {/* Email Field */}
                <InputField
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  label="Email Address"
                  placeholder="john@example.com"
                  error={formErrors.email}
                  leftIcon={<Mail className="w-5 h-5" />}
                  autoComplete="email"
                />

                {/* Password Field */}
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  label="Password"
                  placeholder="Create a strong password"
                  error={formErrors.password}
                  autoComplete="new-password"
                  showStrengthIndicator
                />

                {/* Confirm Password Field */}
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  error={formErrors.confirmPassword}
                  autoComplete="new-password"
                />

                {/* Terms Acceptance */}
                <AuthCheckbox
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  error={formErrors.acceptTerms}
                  label={
                    <span>
                      I agree to the{' '}
                      <AuthLink href="/terms" className="text-xs">
                        Terms of Service
                      </AuthLink>{' '}
                      and{' '}
                      <AuthLink href="/privacy" className="text-xs">
                        Privacy Policy
                      </AuthLink>
                    </span>
                  }
                />

                {/* Submit Button */}
                <AuthButton
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
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
                      Already have an account?
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-neutral-400">
                  <AuthLink href="/auth/login">
                    Sign in to your account
                  </AuthLink>
                </p>
              </div>
            </AuthForm>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Signup Page with Public Route Protection
 */
export default function SignupPage() {
  return (
    <PublicRoute>
      <SignupPageContent />
    </PublicRoute>
  );
}