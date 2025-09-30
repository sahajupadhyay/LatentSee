import { NextRequest, NextResponse } from 'next/server';

/**
 * Security Utilities for LatentSee API
 * 
 * Provides consistent security headers and CORS configuration
 * across all API endpoints for production-grade security.
 */

export interface SecurityConfig {
  corsOrigins: string[];
  allowCredentials: boolean;
  cspDirectives?: string[];
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  corsOrigins: process.env.NODE_ENV === 'production' 
    ? ['https://latentsee.com'] // Replace with your production domain(s)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowCredentials: true
};

/**
 * Standard CORS headers for API responses
 */
export function getCorsHeaders(request?: NextRequest, config?: Partial<SecurityConfig>): Record<string, string> {
  const securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
  const origin = request?.headers.get('origin') || '';
  
  // Check if the origin is allowed
  const isAllowedOrigin = securityConfig.corsOrigins.includes('*') || 
                         securityConfig.corsOrigins.includes(origin) ||
                         (process.env.NODE_ENV === 'development' && origin.includes('localhost'));
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : securityConfig.corsOrigins[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': [
      'Content-Type',
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'If-None-Match',
      'X-Request-ID'
    ].join(', '),
    'Access-Control-Expose-Headers': [
      'X-Cache-Status',
      'X-Cache-Hit-Rate',
      'X-Response-Time',
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'ETag',
      'Retry-After'
    ].join(', '),
    'Access-Control-Max-Age': '86400',
    ...(securityConfig.allowCredentials ? { 'Access-Control-Allow-Credentials': 'true' } : {})
  };
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Remove server fingerprinting
    'Server': 'LatentSee-API',
    
    // Cache control for API responses
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * Apply security headers to any NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  request?: NextRequest,
  config?: Partial<SecurityConfig>
): NextResponse {
  const corsHeaders = getCorsHeaders(request, config);
  const securityHeaders = getSecurityHeaders();
  
  // Apply all headers
  Object.entries({ ...corsHeaders, ...securityHeaders }).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Create a CORS preflight response
 */
export function createPreflightResponse(request?: NextRequest, config?: Partial<SecurityConfig>): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return applySecurityHeaders(response, request, config);
}

/**
 * Validate request origin against allowed origins
 */
export function isValidOrigin(request: NextRequest, config?: Partial<SecurityConfig>): boolean {
  const securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
  const origin = request.headers.get('origin') || '';
  
  // Allow requests with no origin (like direct API calls)
  if (!origin) return true;
  
  // Check against allowed origins
  return securityConfig.corsOrigins.includes('*') ||
         securityConfig.corsOrigins.includes(origin) ||
         (process.env.NODE_ENV === 'development' && origin.includes('localhost'));
}

/**
 * Content Security Policy directives for different content types
 */
export const CSP_DIRECTIVES = {
  API: [
    "default-src 'none'",
    "connect-src 'self'"
  ].join('; '),
  
  WEB_APP: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

/**
 * Sanitize input strings to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate request size to prevent DoS
 */
export function validateRequestSize(request: NextRequest, maxSizeKB: number = 100): boolean {
  const contentLength = request.headers.get('content-length');
  
  if (!contentLength) return true; // No content-length header
  
  const sizeKB = parseInt(contentLength, 10) / 1024;
  return sizeKB <= maxSizeKB;
}

/**
 * Security middleware wrapper for API routes
 */
export function withSecurity(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config?: Partial<SecurityConfig>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return createPreflightResponse(request, config);
    }
    
    // Validate origin
    if (!isValidOrigin(request, config)) {
      return NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      );
    }
    
    // Validate request size
    if (!validateRequestSize(request)) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }
    
    try {
      const response = await handler(request, ...args);
      return applySecurityHeaders(response, request, config);
    } catch (error) {
      console.error('Security middleware error:', error);
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return applySecurityHeaders(errorResponse, request, config);
    }
  };
}

/**
 * Rate limiting and security configuration for different endpoint types
 */
export const SECURITY_PROFILES = {
  PUBLIC_API: {
    corsOrigins: ['*'],
    allowCredentials: false
  },
  
  AUTHENTICATED_API: {
    corsOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://latentsee.com']
      : ['http://localhost:3000'],
    allowCredentials: true
  },
  
  ADMIN_API: {
    corsOrigins: process.env.NODE_ENV === 'production'
      ? ['https://admin.latentsee.com']
      : ['http://localhost:3000'],
    allowCredentials: true
  }
};

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  } else {
    // Server-side
    return require('crypto').randomBytes(16).toString('base64');
  }
}