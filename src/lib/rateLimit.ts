import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate Limiting Utilities for API Routes
 * 
 * Provides consistent rate limiting functionality that can be used
 * within API routes for additional protection or custom limits.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitOptions {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

// In-memory store for API-level rate limiting
const apiRateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
}>();

/**
 * Apply rate limiting within an API route
 */
export function applyRateLimit(
  request: NextRequest, 
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = options.keyGenerator ? 
    options.keyGenerator(request) : 
    getDefaultKey(request);
  
  const entry = apiRateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // First request or expired window
    apiRateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs
    });
    
    return {
      success: true,
      limit: options.requests,
      remaining: options.requests - 1,
      resetTime: now + options.windowMs
    };
  }
  
  if (entry.count >= options.requests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return {
      success: false,
      limit: options.requests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    };
  }
  
  // Increment counter
  entry.count++;
  apiRateLimitStore.set(key, entry);
  
  return {
    success: true,
    limit: options.requests,
    remaining: options.requests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  requestId?: string
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }
  
  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }
  
  return response;
}

/**
 * Create a rate limit exceeded response
 */
export function createRateLimitExceededResponse(
  result: RateLimitResult,
  requestId?: string
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests for this endpoint. Please try again later.',
      metadata: {
        requestId: requestId || 'unknown',
        timestamp: new Date().toISOString(),
        limit: result.limit,
        remaining: result.remaining,
        resetTime: new Date(result.resetTime).toISOString(),
        retryAfter: result.retryAfter
      }
    },
    { status: 429 }
  );
  
  return addRateLimitHeaders(response, result, requestId);
}

/**
 * Default key generator for rate limiting
 */
function getDefaultKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const remoteAddress = request.headers.get('x-vercel-forwarded-for');
  
  const clientIp = forwardedFor?.split(',')[0]?.trim() || 
                   realIp || 
                   remoteAddress || 
                   'unknown';
  
  const pathname = new URL(request.url).pathname;
  return `${clientIp}:${pathname}`;
}

/**
 * Cleanup expired entries from the rate limit store
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  for (const [key, entry] of apiRateLimitStore.entries()) {
    if (now > entry.resetTime) {
      apiRateLimitStore.delete(key);
    }
  }
}

/**
 * Get current rate limit store statistics
 */
export function getRateLimitStats(): {
  totalKeys: number;
  activeKeys: number;
  memoryUsage: number;
} {
  const now = Date.now();
  let activeKeys = 0;
  
  for (const [, entry] of apiRateLimitStore.entries()) {
    if (now <= entry.resetTime) {
      activeKeys++;
    }
  }
  
  return {
    totalKeys: apiRateLimitStore.size,
    activeKeys,
    memoryUsage: process.memoryUsage().heapUsed
  };
}

/**
 * Rate limiting decorator for API route handlers
 */
export function withRateLimit(
  options: RateLimitOptions
) {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (request: NextRequest, ...args: any[]) => {
      const result = applyRateLimit(request, options);
      
      if (!result.success) {
        return createRateLimitExceededResponse(result);
      }
      
      const response = await handler(request, ...args);
      return addRateLimitHeaders(response, result);
    }) as T;
  };
}

/**
 * Predefined rate limiting configurations for common use cases
 */
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for auth endpoints
  AUTH: {
    requests: 5,
    windowMs: 60 * 1000 // 5 requests per minute
  },
  
  // Standard API limits
  API_STANDARD: {
    requests: 100,
    windowMs: 60 * 1000 // 100 requests per minute
  },
  
  // Generous limits for health checks
  HEALTH_CHECK: {
    requests: 200,
    windowMs: 60 * 1000 // 200 requests per minute
  },
  
  // Strict limits for expensive operations
  EXPENSIVE: {
    requests: 10,
    windowMs: 60 * 1000 // 10 requests per minute
  }
};

// Set up periodic cleanup
setInterval(cleanupRateLimitStore, 5 * 60 * 1000); // Clean up every 5 minutes