'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RouteGuardProps } from '@/lib/auth/types';

/**
 * Route Protection Components
 * 
 * Provides declarative route protection with proper loading states,
 * redirects, and user feedback. Supports both protected and public routes.
 */

/**
 * Loading Component for Authentication States
 */
const AuthLoadingSpinner: React.FC = () => (
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
      <p className="text-neutral-300">Checking authentication...</p>
    </motion.div>
  </div>
);

/**
 * Unauthorized Access Component
 */
const UnauthorizedAccess: React.FC<{ redirectPath: string }> = ({ redirectPath }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Shield className="w-8 h-8 text-red-400" />
        </motion.div>

        <h1 className="text-2xl font-heading font-bold text-white mb-4">
          Authentication Required
        </h1>

        <p className="text-neutral-400 mb-8">
          You need to sign in to access this page. Your session may have expired or you haven't logged in yet.
        </p>

        <button
          onClick={() => router.push(redirectPath)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 
                     hover:from-accent-600 hover:to-accent-700 text-white font-medium rounded-xl 
                     transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-accent-500/25 
                     hover:shadow-accent-500/40 hover:shadow-xl border border-accent-400/20
                     focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2 focus:ring-offset-primary-950"
        >
          Sign In to Continue
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-sm text-neutral-500 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => router.push('/auth/signup')}
            className="text-accent-400 hover:text-accent-300 underline-offset-4 hover:underline"
          >
            Create one here
          </button>
        </p>
      </motion.div>
    </div>
  );
};

/**
 * Protected Route Component
 * 
 * Wraps components that require authentication. Handles loading states,
 * redirects, and provides fallback UI.
 */
export const ProtectedRoute: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  fallback
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      // Build login URL with return path
      const loginUrl = new URL(redirectTo, window.location.origin);
      loginUrl.searchParams.set('redirect', pathname);
      
      router.push(loginUrl.toString());
    }
  }, [isLoading, requireAuth, isAuthenticated, router, redirectTo, pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || <AuthLoadingSpinner />;
  }

  // Show unauthorized access if authentication required but user not authenticated
  if (requireAuth && !isAuthenticated) {
    const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
    return <UnauthorizedAccess redirectPath={loginUrl} />;
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * Public Route Component
 * 
 * Redirects authenticated users away from auth pages (login, signup)
 * to prevent confusion and improve UX.
 */
export const PublicRoute: React.FC<RouteGuardProps> = ({
  children,
  redirectTo = '/dashboard',
  fallback
}) => {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || <AuthLoadingSpinner />;
  }

  // Don't render content if user is authenticated (will redirect)
  if (isAuthenticated) {
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
          <p className="text-neutral-300">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Render public content for non-authenticated users
  return <>{children}</>;
};

/**
 * Authentication Guard Hook
 * 
 * Programmatic authentication checking for use in components
 * that need conditional rendering or logic based on auth state.
 */
export const useAuthGuard = (requireAuth: boolean = true) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const redirectToLogin = (returnPath?: string) => {
    const loginUrl = new URL('/auth/login', window.location.origin);
    loginUrl.searchParams.set('redirect', returnPath || pathname);
    router.push(loginUrl.toString());
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    canAccess: requireAuth ? isAuthenticated : true,
    redirectToLogin,
    redirectToDashboard
  };
};

/**
 * Auth Status Badge Component
 * 
 * Visual indicator of authentication status for development/debugging
 */
export const AuthStatusBadge: React.FC = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-xs font-medium backdrop-blur-sm border"
      style={{
        backgroundColor: isLoading 
          ? 'rgba(100, 116, 139, 0.2)' 
          : isAuthenticated 
            ? 'rgba(34, 197, 94, 0.2)'
            : 'rgba(239, 68, 68, 0.2)',
        borderColor: isLoading 
          ? 'rgb(100, 116, 139)' 
          : isAuthenticated 
            ? 'rgb(34, 197, 94)'
            : 'rgb(239, 68, 68)',
        color: isLoading 
          ? 'rgb(148, 163, 184)' 
          : isAuthenticated 
            ? 'rgb(74, 222, 128)'
            : 'rgb(248, 113, 113)'
      }}
    >
      {isLoading ? (
        'Loading...'
      ) : isAuthenticated ? (
        `Authenticated: ${user?.email || 'Unknown'}`
      ) : (
        'Not Authenticated'
      )}
    </motion.div>
  );
};