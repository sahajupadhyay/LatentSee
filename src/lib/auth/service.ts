import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/lib/logger';
import {
  AuthUser,
  AuthResponse,
  AuthError,
  LoginFormData,
  SignupFormData,
  UserProfile,
  UserSession,
  SessionMetadata
} from './types';

/**
 * Authentication Service
 * 
 * Handles all authentication operations with Supabase,
 * including sign in, sign up, session management, and user profile operations.
 * 
 * Features:
 * - Secure authentication with Supabase
 * - Session management with automatic refresh
 * - User profile management
 * - Comprehensive error handling
 * - Request logging and correlation
 * - Type-safe operations
 */

export class AuthService {
  private client: SupabaseClient | null = null;
  private logger = createLogger('auth-service');
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize immediately - wait for first use
  }

  /**
   * Lazy initialization - only initialize when actually needed
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initialize();
    return this.initializationPromise;
  }

  /**
   * Initialize the Supabase client
   */
  private async initialize(): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      this.logger.warn('Supabase environment variables not configured. Auth features will be disabled.', {
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseAnonKey)
      });
      this.initialized = true; // Mark as initialized even if not configured
      return;
    }

    try {
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce' // More secure flow for web applications
        },
        global: {
          headers: {
            'x-client-info': 'latentsee-auth@1.0.0'
          }
        }
      });
      this.initialized = true;
      this.logger.info('Supabase auth client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client', error as Error);
      this.initialized = true; // Mark as initialized to prevent retry loops
      throw error;
    }
  }

  /**
   * Check if auth service is properly configured
   */
  private isConfigured(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: LoginFormData, requestId: string = uuidv4()): Promise<AuthResponse> {
    const logger = createLogger(requestId);
    
    if (!this.isConfigured() || !this.client) {
      logger.error('Auth service not configured - cannot sign in');
      return {
        success: false,
        error: {
          message: 'Authentication service is not configured. Please check your environment variables.',
          code: 'AUTH_NOT_CONFIGURED'
        }
      };
    }
    
    try {
      logger.info('Attempting user sign in', { 
        email: data.email,
        rememberMe: data.rememberMe 
      });

      const { data: authData, error } = await this.client.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        logger.error('Sign in failed', new Error(error.message), { 
          code: error.message,
          email: data.email 
        });
        
        return {
          success: false,
          error: {
            message: this.getReadableErrorMessage(error.message),
            code: error.message,
            details: error
          }
        };
      }

      if (!authData.user) {
        logger.error('Sign in succeeded but no user returned', new Error('No user data'));
        return {
          success: false,
          error: {
            message: 'Authentication failed - please try again',
            code: 'NO_USER_DATA'
          }
        };
      }

      // Get user profile
      const profile = await this.getUserProfile(authData.user.id, requestId);
      
      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        emailVerified: authData.user.email_confirmed_at !== null,
        profile
      };

      logger.info('User signed in successfully', { 
        userId: authUser.id,
        email: authUser.email,
        emailVerified: authUser.emailVerified 
      });

      return {
        success: true,
        user: authUser,
        redirectTo: '/dashboard' // Default redirect after sign in
      };

    } catch (error) {
      logger.error('Unexpected error during sign in', error as Error, { 
        email: data.email 
      });
      
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(data: SignupFormData, requestId: string = uuidv4()): Promise<AuthResponse> {
    const logger = createLogger(requestId);
    
    if (!this.isConfigured() || !this.client) {
      logger.error('Auth service not configured - cannot sign up');
      return {
        success: false,
        error: {
          message: 'Authentication service is not configured. Please check your environment variables.',
          code: 'AUTH_NOT_CONFIGURED'
        }
      };
    }
    
    try {
      logger.info('Attempting user sign up', { 
        email: data.email,
        name: data.name 
      });

      // Sign up with Supabase Auth
      const { data: authData, error } = await this.client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            full_name: data.name
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        logger.error('Sign up failed', new Error(error.message), { 
          code: error.message,
          email: data.email 
        });
        
        return {
          success: false,
          error: {
            message: this.getReadableErrorMessage(error.message),
            code: error.message,
            details: error
          }
        };
      }

      if (!authData.user) {
        logger.error('Sign up succeeded but no user returned', new Error('No user data'));
        return {
          success: false,
          error: {
            message: 'Account creation failed - please try again',
            code: 'NO_USER_DATA'
          }
        };
      }

      logger.info('User signed up successfully', { 
        userId: authData.user.id,
        email: authData.user.email,
        needsConfirmation: !authData.session 
      });

      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        emailVerified: authData.user.email_confirmed_at !== null,
        profile: {
          id: authData.user.id,
          email: authData.user.email!,
          name: data.name,
          fullName: data.name,
          createdAt: authData.user.created_at,
          updatedAt: authData.user.updated_at || authData.user.created_at,
          emailVerified: authData.user.email_confirmed_at !== null
        }
      };

      return {
        success: true,
        user: authUser,
        redirectTo: authData.session ? '/dashboard' : '/auth/verify-email'
      };

    } catch (error) {
      logger.error('Unexpected error during sign up', error as Error, { 
        email: data.email 
      });
      
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(requestId: string = uuidv4()): Promise<void> {
    const logger = createLogger(requestId);
    
    if (!this.isConfigured() || !this.client) {
      logger.error('Auth service not configured - cannot sign out');
      throw new AuthError('Authentication service is not configured', 'AUTH_NOT_CONFIGURED');
    }
    
    try {
      logger.info('Attempting user sign out');

      const { error } = await this.client.auth.signOut();

      if (error) {
        logger.error('Sign out failed', new Error(error.message));
        throw new AuthError('Failed to sign out', error.message, error);
      }

      logger.info('User signed out successfully');

    } catch (error) {
      logger.error('Unexpected error during sign out', error as Error);
      throw error;
    }
  }

  /**
   * Get current user session
   */
  async getCurrentUser(requestId: string = uuidv4()): Promise<AuthUser | null> {
    const logger = createLogger(requestId);
    
    if (!this.isConfigured() || !this.client) {
      logger.debug('Auth service not configured - skipping user retrieval', {
        initialized: this.initialized,
        hasClient: Boolean(this.client)
      });
      return null;
    }
    
    try {
      const { data: { user }, error } = await this.client.auth.getUser();

      if (error) {
        logger.warn('Supabase returned error for getCurrentUser', {
          errorMessage: error.message,
          errorCode: error.status || 'unknown',
          requestId 
        });
        return null;
      }

      if (!user) {
        logger.debug('No current user session found');
        return null;
      }

      const profile = await this.getUserProfile(user.id, requestId);

      const authUser = {
        id: user.id,
        email: user.email!,
        emailVerified: user.email_confirmed_at !== null,
        profile
      };

      logger.debug('Current user retrieved successfully', {
        userId: authUser.id,
        email: authUser.email,
        emailVerified: authUser.emailVerified
      });

      return authUser;

    } catch (error) {
      logger.warn('Unexpected error getting current user - likely configuration issue', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        isConfigured: this.isConfigured()
      });
      return null;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string, requestId: string = uuidv4()): Promise<AuthResponse> {
    const logger = createLogger(requestId);
    
    if (!this.isConfigured() || !this.client) {
      logger.error('Auth service not configured - cannot reset password');
      return {
        success: false,
        error: {
          message: 'Authentication service is not configured. Please check your environment variables.',
          code: 'AUTH_NOT_CONFIGURED'
        }
      };
    }
    
    try {
      logger.info('Attempting password reset', { email });

      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        logger.error('Password reset failed', new Error(error.message), { 
          code: error.message,
          email 
        });
        
        return {
          success: false,
          error: {
            message: this.getReadableErrorMessage(error.message),
            code: error.message,
            details: error
          }
        };
      }

      logger.info('Password reset email sent', { email });

      return {
        success: true,
        redirectTo: '/auth/reset-password-sent'
      };

    } catch (error) {
      logger.error('Unexpected error during password reset', error as Error, { email });
      
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Get user profile from database
   */
  private async getUserProfile(userId: string, requestId: string): Promise<UserProfile | undefined> {
    const logger = createLogger(requestId);
    
    if (!this.isConfigured() || !this.client) {
      logger.debug('Auth service not configured - cannot get user profile');
      return undefined;
    }
    
    try {
      // For now, we'll construct profile from auth metadata
      // Later, you can extend this to fetch from a profiles table
      const { data: user } = await this.client.auth.getUser();
      
      if (!user.user) return undefined;

      return {
        id: userId,
        email: user.user.email!,
        name: user.user.user_metadata?.name || user.user.user_metadata?.full_name || '',
        fullName: user.user.user_metadata?.full_name || user.user.user_metadata?.name || user.user.email!,
        avatarUrl: user.user.user_metadata?.avatar_url,
        createdAt: user.user.created_at,
        updatedAt: user.user.updated_at || user.user.created_at,
        emailVerified: user.user.email_confirmed_at !== null,
        lastSignInAt: user.user.last_sign_in_at
      };

    } catch (error) {
      logger.error('Failed to get user profile', error as Error, { userId });
      return undefined;
    }
  }

  /**
   * Convert Supabase error messages to user-friendly messages
   */
  private getReadableErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'The email or password you entered is incorrect.',
      'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
      'User already registered': 'An account with this email already exists. Try signing in instead.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'Signup is disabled': 'New account creation is temporarily disabled.',
      'Email rate limit exceeded': 'Too many requests. Please wait a moment before trying again.',
      'Invalid email': 'Please enter a valid email address.',
      'Weak password': 'Please choose a stronger password.'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    if (!this.isConfigured() || !this.client) {
      // Return a no-op function if not configured
      return () => {};
    }

    const { data: { subscription } } = this.client.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await this.getUserProfile(session.user.id, uuidv4());
          callback({
            id: session.user.id,
            email: session.user.email!,
            emailVerified: session.user.email_confirmed_at !== null,
            profile
          });
        } else {
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }
}

// Singleton instance
export const authService = new AuthService();