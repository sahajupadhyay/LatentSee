'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from './service';
import {
  AuthContextType,
  AuthUser,
  AuthState,
  LoginFormData,
  SignupFormData,
  UpdatePasswordFormData,
  AuthResponse
} from './types';
import { createLogger } from '@/lib/logger';

/**
 * Authentication Context Provider
 * 
 * Manages global authentication state using React Context and useReducer.
 * Provides authentication actions and state to all child components.
 * 
 * Features:
 * - Centralized auth state management
 * - Automatic session restoration on app load
 * - Auth state persistence across page refreshes
 * - Optimistic updates for better UX
 * - Comprehensive error handling
 */

// Auth Actions
type AuthAction =
  | { type: 'AUTH_LOADING'; payload: boolean }
  | { type: 'AUTH_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_SIGNOUT' }
  | { type: 'CLEAR_ERROR' };

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isAuthenticated: true,
        error: null
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload
      };

    case 'AUTH_SIGNOUT':
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true, // Start with loading true to check for existing session
  isAuthenticated: false,
  error: null
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Provider Component
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const logger = createLogger('auth-provider');

  /**
   * Sign in user
   */
  const signIn = useCallback(async (data: LoginFormData): Promise<AuthResponse> => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      const response = await authService.signIn(data);

      if (response.success && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        logger.info('User signed in successfully', { userId: response.user.id });
      } else if (response.error) {
        dispatch({ type: 'AUTH_ERROR', payload: response.error.message });
        logger.error('Sign in failed', new Error(response.error.message));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      logger.error('Unexpected sign in error', error as Error);
      
      return {
        success: false,
        error: {
          message: errorMessage,
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  }, [logger]);

  /**
   * Sign up user
   */
  const signUp = useCallback(async (data: SignupFormData): Promise<AuthResponse> => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      const response = await authService.signUp(data);

      if (response.success && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        logger.info('User signed up successfully', { userId: response.user.id });
      } else if (response.error) {
        dispatch({ type: 'AUTH_ERROR', payload: response.error.message });
        logger.error('Sign up failed', new Error(response.error.message));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      logger.error('Unexpected sign up error', error as Error);
      
      return {
        success: false,
        error: {
          message: errorMessage,
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  }, [logger]);

  /**
   * Sign out user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });
      
      await authService.signOut();
      dispatch({ type: 'AUTH_SIGNOUT' });
      
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Sign out error', error as Error);
      // Even if sign out fails on the server, clear local state
      dispatch({ type: 'AUTH_SIGNOUT' });
    }
  }, [logger]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      const response = await authService.resetPassword(email);

      if (response.success) {
        dispatch({ type: 'AUTH_LOADING', payload: false });
        logger.info('Password reset initiated', { email });
      } else if (response.error) {
        dispatch({ type: 'AUTH_ERROR', payload: response.error.message });
        logger.error('Password reset failed', new Error(response.error.message));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      logger.error('Unexpected password reset error', error as Error);
      
      return {
        success: false,
        error: {
          message: errorMessage,
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  }, [logger]);

  /**
   * Update password (placeholder - implement when needed)
   */
  const updatePassword = useCallback(async (data: UpdatePasswordFormData): Promise<AuthResponse> => {
    // Placeholder implementation
    return {
      success: false,
      error: {
        message: 'Password update not implemented yet',
        code: 'NOT_IMPLEMENTED'
      }
    };
  }, []);

  /**
   * Refresh current user data
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      const user = await authService.getCurrentUser();

      if (user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        logger.info('User data refreshed', { userId: user.id });
      } else {
        dispatch({ type: 'AUTH_SIGNOUT' });
        logger.info('No authenticated user found');
      }
    } catch (error) {
      logger.error('Failed to refresh user', error as Error);
      dispatch({ type: 'AUTH_SIGNOUT' });
    }
  }, [logger]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        logger.info('Initializing authentication state');

        // Quick timeout for faster initialization (3 seconds)
        const timeout = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 3000)
        );

        logger.debug('Starting user authentication check');
        
        let user = null;
        try {
          const userPromise = authService.getCurrentUser();
          user = await Promise.race([userPromise, timeout]);
          logger.debug('Auth service call completed successfully', { hasUser: Boolean(user) });
        } catch (timeoutError) {
          // On timeout, just continue without authentication
          logger.info('Auth initialization timed out - app ready for guest usage', {
            timeout: '3s',
            hasConfig: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
          });
          user = null;
        }

        if (isMounted) {
          if (user) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
            logger.info('Authentication state restored', { userId: user.id });
          } else {
            dispatch({ type: 'AUTH_LOADING', payload: false });
            logger.debug('No existing session - ready for new authentication');
          }
        }
      } catch (error) {
        logger.warn('Auth initialization error - continuing', { error: error instanceof Error ? error.message : String(error) });
        
        // Always ensure app is not stuck in loading state
        if (isMounted) {
          dispatch({ type: 'AUTH_LOADING', payload: false });
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [logger]);

  /**
   * Listen to auth state changes from Supabase
   */
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        logger.info('Auth state changed - user authenticated', { userId: user.id });
      } else {
        dispatch({ type: 'AUTH_SIGNOUT' });
        logger.info('Auth state changed - user signed out');
      }
    });

    return unsubscribe;
  }, [logger]);

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUser,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook for authentication status only (lighter than useAuth)
 */
export function useAuthStatus() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated
  };
}