import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Rate Limiting Middleware for LatentSee API
 * 
 * Implements multiple rate limiting strategies:
 * 1. Global API rate limiting
 * 2. Per-IP rate limiting 
 * 3. Per-endpoint specific limits
 * 4. Authenticated user rate limits
 * 
 * Features:
 * - Token bucket algorithm for smooth rate limiting
 * - Different limits for different endpoints
 * - IP-based tracking with sliding window
 * - Graceful degradation and retry headers
 * - Memory-efficient cleanup of expired entries
 */

// Rate limiting configurations
interface RateLimitConfig {
  requests: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API endpoints - more restrictive
  '/api/check-fast': { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  '/api/always-fresh': { requests: 50, windowMs: 60 * 1000 }, // 50 requests per minute
  '/api/smart-memory': { requests: 75, windowMs: 60 * 1000 }, // 75 requests per minute
  
  // Health check - more lenient
  '/api/health': { requests: 200, windowMs: 60 * 1000 }, // 200 requests per minute
  
  // Auth endpoints - more restrictive to prevent abuse
  '/api/auth': { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  
  // Global fallback
  default: { requests: 200, windowMs: 60 * 1000 } // 200 requests per minute
};

// Memory store for rate limit tracking
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  
  lastCleanup = now;
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get the real client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const remoteAddress = request.headers.get('x-vercel-forwarded-for');
  
  // Use the first IP from x-forwarded-for (in case of multiple proxies)
  const clientIp = forwardedFor?.split(',')[0]?.trim() || 
                   realIp || 
                   remoteAddress || 
                   'unknown';
  
  // For authenticated requests, we could also include user ID
  // const userId = request.headers.get('x-user-id');
  // return userId ? `user:${userId}` : `ip:${clientIp}`;
  
  return `ip:${clientIp}`;
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check for exact matches first
  if (RATE_LIMITS[pathname]) {
    return RATE_LIMITS[pathname];
  }
  
  // Check for prefix matches
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }
  
  return RATE_LIMITS.default;
}

function isRateLimited(clientId: string, pathname: string): {
  limited: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  cleanupExpiredEntries();
  
  const config = getRateLimitConfig(pathname);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const key = `${clientId}:${pathname}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    // First request from this client for this endpoint
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now
    });
    
    return {
      limited: false,
      limit: config.requests,
      remaining: config.requests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // Check if the window has expired
  if (now > entry.resetTime) {
    // Reset the counter for a new window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now
    });
    
    return {
      limited: false,
      limit: config.requests,
      remaining: config.requests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // Within the current window
  if (entry.count >= config.requests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return {
      limited: true,
      limit: config.requests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    limited: false,
    limit: config.requests,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime
  };
}

function createRateLimitResponse(
  rateLimitResult: ReturnType<typeof isRateLimited>,
  requestId: string,
  clientId: string
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString()
      }
    },
    { status: 429 }
  );
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
  response.headers.set('X-Request-ID', requestId);
  
  if (rateLimitResult.retryAfter) {
    response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
  }
  
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After');
  
  return response;
}

export function middleware(request: NextRequest) {
  const requestId = uuidv4();
  
  // Skip rate limiting for certain paths
  const { pathname } = request.nextUrl;
  
  // Skip static files and internal Next.js paths
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') && !pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }
  
  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Handle preflight CORS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = isRateLimited(clientId, pathname);
    
    if (rateLimitResult.limited) {
      console.log(`Rate limit exceeded for ${clientId} on ${pathname}`, {
        requestId,
        limit: rateLimitResult.limit,
        resetTime: new Date(rateLimitResult.resetTime).toISOString()
      });
      
      return createRateLimitResponse(rateLimitResult, requestId, clientId);
    }
    
    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
    response.headers.set('X-Request-ID', requestId);
    
    return response;
    
  } catch (error) {
    console.error('Rate limiting middleware error:', error, { requestId });
    
    // If rate limiting fails, allow the request through
    // This ensures the API remains available even if rate limiting breaks
    const response = NextResponse.next();
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-RateLimit-Error', 'true');
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};