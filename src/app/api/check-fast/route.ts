import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import { supabase } from '@/lib/supabase';
import { ttlCache } from '@/lib/cache';
import { createLogger } from '@/lib/logger';
import { 
  GetProductsQuerySchema, 
  DatabaseError, 
  ValidationError, 
  TimeoutError,
  ApiResponse,
  Product 
} from '@/lib/types';

/**
 * Check Fast API Route - TTL Cache Model (Eventual Consistency)
 * 
 * This endpoint demonstrates eventual consistency by serving cached data
 * that may be stale but provides significantly faster response times.
 * It implements a time-to-live (TTL) caching strategy where data is
 * considered fresh for a configurable period.
 * 
 * Features:
 * - TTL-based caching with configurable expiration
 * - Cache hit/miss metrics and reporting
 * - Stale-while-revalidate pattern
 * - Cache warming on miss
 * - Performance comparison metrics
 * - Proper HTTP cache headers
 * 
 * Trade-offs:
 * - ✅ Much faster response times (cache hits)
 * - ❌ Possible stale data during TTL window
 * - ✅ Reduces database load
 * - ❌ Eventually consistent (not strongly consistent)
 * 
 * @swagger
 * /api/check-fast:
 *   get:
 *     summary: Fetch products with TTL cache (eventual consistency)
 *     description: Returns cached product data when available, fresh data on cache miss
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: cache_ttl
 *         schema:
 *           type: integer
 *           minimum: 5
 *           maximum: 300
 *           default: 60
 *         description: Cache TTL in seconds
 *     responses:
 *       200:
 *         description: Products retrieved (cached or fresh)
 *       304:
 *         description: Not Modified (client cache hit)
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = uuidv4();
  const logger = createLogger(requestId);
  const startTime = performance.now();

  // Extract request metadata
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor || realIp || 'unknown';
  const ifNoneMatch = request.headers.get('if-none-match');

  logger.info('Processing check-fast request (TTL cache)', {
    userAgent,
    clientIp,
    url: request.url,
    ifNoneMatch
  });

  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    let validatedQuery;
    let cacheTTL = 60; // Default 60 seconds
    
    try {
      validatedQuery = GetProductsQuerySchema.parse(queryParams);
      
      // Parse cache TTL if provided
      if (queryParams.cache_ttl) {
        const ttl = parseInt(queryParams.cache_ttl, 10);
        if (ttl >= 5 && ttl <= 300) {
          cacheTTL = ttl;
        }
      }
      
      logger.info('Query parameters validated', { 
        query: validatedQuery, 
        cacheTTL 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Invalid query parameters', { 
          zodErrors: error.issues,
          receivedParams: queryParams 
        });
        
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            metadata: {
              requestId,
              timestamp: new Date().toISOString(),
              duration: Math.round((performance.now() - startTime) * 100) / 100
            }
          } satisfies ApiResponse,
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': requestId
            }
          }
        );
      }
      throw error;
    }

    // Generate cache key based on query parameters
    const cacheKey = `products:${JSON.stringify(validatedQuery)}`;
    
    // Check cache first
    const cacheStartTime = performance.now();
    const cachedEntry = ttlCache.get<Product[]>(cacheKey, requestId);
    const cacheCheckDuration = Math.round((performance.now() - cacheStartTime) * 100) / 100;
    
    let products: Product[];
    let fromCache = false;
    let dbDuration = 0;
    let cacheMetrics = ttlCache.getMetrics();
    
    if (cachedEntry) {
      // Cache hit - serve cached data
      products = cachedEntry.data;
      fromCache = true;
      
      logger.info('Cache hit - serving cached data', {
        cacheKey,
        cachedAt: cachedEntry.cachedAt,
        expiresAt: cachedEntry.expiresAt,
        age: Math.round((Date.now() - new Date(cachedEntry.cachedAt).getTime()) / 1000)
      });
      
      // Generate ETag for cached data
      const etag = `"cached-${Buffer.from(JSON.stringify(products)).toString('base64').slice(0, 16)}"`;
      
      // Check if client has current cached version
      if (ifNoneMatch === etag) {
        logger.info('Client cache hit (304 Not Modified)', { etag });
        return new NextResponse(null, {
          status: 304,
          headers: {
            'X-Request-ID': requestId,
            'X-Cache-Status': 'HIT',
            'ETag': etag
          }
        });
      }
      
    } else {
      // Cache miss - fetch from database and cache result
      logger.info('Cache miss - fetching from database', { cacheKey });
      
      const dbStartTime = performance.now();
      try {
        products = await supabase.getProducts(validatedQuery, requestId);
        dbDuration = Math.round((performance.now() - dbStartTime) * 100) / 100;
        
        // Cache the fresh data
        const cacheSuccess = ttlCache.set(cacheKey, products, cacheTTL, requestId);
        
        if (cacheSuccess) {
          logger.info('Data cached successfully', { 
            cacheKey, 
            ttl: cacheTTL, 
            productCount: products.length 
          });
        } else {
          logger.warn('Failed to cache data', { cacheKey });
        }
        
        // Update metrics after cache operation
        cacheMetrics = ttlCache.getMetrics();
        
      } catch (dbError) {
        logger.error('Database fetch failed during cache miss', dbError as Error);
        throw dbError;
      }
    }
    
    const totalDuration = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Generate ETag for response
    const etag = fromCache 
      ? `"cached-${Buffer.from(JSON.stringify(products)).toString('base64').slice(0, 16)}"`
      : `"fresh-${Buffer.from(JSON.stringify(products)).toString('base64').slice(0, 16)}"`;
    
    logger.info('Request completed successfully', {
      productCount: products.length,
      duration: totalDuration,
      fromCache,
      cacheMetrics: {
        hitRate: cacheMetrics.hitRate,
        size: cacheMetrics.size
      }
    });

    const response: ApiResponse = {
      data: products,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        count: products.length
      }
    };

    // Calculate appropriate max-age based on cache status
    const maxAge = fromCache ? Math.max(0, cacheTTL - Math.round((Date.now() - new Date(cachedEntry!.cachedAt).getTime()) / 1000)) : cacheTTL;

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        
        // Cache control headers for TTL model
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${Math.max(30, maxAge / 2)}`,
        'ETag': etag,
        
        // Performance and cache metrics headers
        'X-Cache-Status': fromCache ? 'HIT' : 'MISS',
        'X-Cache-Hit-Rate': `${cacheMetrics.hitRate.toFixed(1)}%`,
        'X-Cache-Size': cacheMetrics.size.toString(),
        'X-Response-Time': `${totalDuration}ms`,
        'X-Cache-Check-Time': `${cacheCheckDuration}ms`,
        'X-DB-Time': `${dbDuration}ms`,
        'X-From-Cache': fromCache.toString(),
        
        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
        'Access-Control-Expose-Headers': 'X-Cache-Status, X-Cache-Hit-Rate, X-Response-Time, ETag',
        
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });

  } catch (error) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Handle specific error types
    if (error instanceof ValidationError) {
      logger.error('Validation error in check-fast endpoint', error);
      return NextResponse.json(
        {
          error: 'Data validation failed',
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            duration
          }
        } satisfies ApiResponse,
        { 
          status: 422,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Cache-Status': 'ERROR'
          }
        }
      );
    }

    if (error instanceof TimeoutError) {
      logger.error('Database timeout in check-fast endpoint', error);
      return NextResponse.json(
        {
          error: 'Request timeout - please try again',
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            duration
          }
        } satisfies ApiResponse,
        { 
          status: 504,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Cache-Status': 'ERROR',
            'Retry-After': '5'
          }
        }
      );
    }

    if (error instanceof DatabaseError) {
      logger.error('Database error in check-fast endpoint', error);
      return NextResponse.json(
        {
          error: 'Database service unavailable',
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            duration
          }
        } satisfies ApiResponse,
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Cache-Status': 'ERROR',
            'Retry-After': '10'
          }
        }
      );
    }

    // Handle unexpected errors
    logger.error('Unexpected error in check-fast endpoint', error as Error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          duration
        }
      } satisfies ApiResponse,
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Cache-Status': 'ERROR'
        }
      }
    );
  }
}

// Handle preflight CORS requests
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
      'Access-Control-Max-Age': '86400'
    }
  });
}