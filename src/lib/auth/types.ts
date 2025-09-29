import { z } from 'zod';

/**
 * Authentication Types and Schemas
 * 
 * Defines all authentication-related types, validation schemas,
 * and interfaces for the LatentSee application.
 */

// Authentication Form Schemas
export const LoginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters'),
  rememberMe: z.boolean().default(false)
});

export const SignupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const ResetPasswordSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
});

export const UpdatePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// TypeScript types derived from schemas
export type LoginFormData = z.infer<typeof LoginSchema>;
export type SignupFormData = z.infer<typeof SignupSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof UpdatePasswordSchema>;

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  lastSignInAt?: string;
}

// Authentication State Types
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profile?: UserProfile;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Authentication Error Types
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Authentication Response Types
export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  redirectTo?: string;
}

// Authentication Provider Types
export interface AuthContextType {
  // State
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  signIn: (data: LoginFormData) => Promise<AuthResponse>;
  signUp: (data: SignupFormData) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updatePassword: (data: UpdatePasswordFormData) => Promise<AuthResponse>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Route Protection Types
export interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// Session Types
export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  lastActivity: string;
  deviceInfo?: {
    platform?: string;
    browser?: string;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  metadata: SessionMetadata;
  isActive: boolean;
}

// Authentication Configuration
export interface AuthConfig {
  redirectUrls: {
    signIn: string;
    signUp: string;
    signOut: string;
    resetPassword: string;
    updatePassword: string;
  };
  sessionConfig: {
    maxAge: number; // in seconds
    refreshThreshold: number; // seconds before expiry to refresh
    rememberMeDuration: number; // seconds for remember me sessions
  };
  validation: {
    minPasswordLength: number;
    maxPasswordLength: number;
    requirePasswordComplexity: boolean;
  };
}