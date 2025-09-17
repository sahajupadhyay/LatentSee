import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import { supabase } from '@/lib/supabase';
import { lruCache } from '@/lib/cache';
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
 * Smart Memory API Route - LRU Cache Model (Intelligent Edge Caching)
 * 
 * This endpoint demonstrates intelligent caching using Least Recently Used (LRU)
 * eviction policy. It simulates edge-based caching where frequently accessed
 * data stays in memory while less popular data is evicted to make room for
 * new entries.
 * 
 * Features:
 * - LRU eviction policy for intelligent memory management
 * - Adaptive caching based on access patterns
 * - Edge-simulation with limited memory constraints
 * - Access frequency tracking and reporting
 * - Smart cache warming based on popularity
 * - Memory usage optimization
 * 
 * Trade-offs:
 * - ✅ Intelligent memory usage (popular data stays cached)
 * - ✅ Adaptive to usage patterns
 * - ❌ Cold start performance on cache evictions
 * - ✅ Better hit rates for frequently accessed data
 * - ❌ Unpredictable staleness (depends on access patterns)
 * 
 * @swagger
 * /api/smart-memory:
 *   get:
 *     summary: Fetch products with LRU cache (intelligent edge caching)
 *     description: Returns cached data based on LRU policy, fresh data on cache miss or eviction
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high]
 *           default: normal
 *         description: Cache priority hint for LRU algorithm
 *     responses:
 *       200:
 *         description: Products retrieved (cached or fresh)
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

  logger.info('Processing smart-memory request (LRU cache)', {
    userAgent,
    clientIp,
    url: request.url
  });

  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    let validatedQuery;
    let priority: 'low' | 'normal' | 'high' = 'normal';
    
    try {
      validatedQuery = GetProductsQuerySchema.parse(queryParams);
      
      // Parse priority hint if provided
      if (queryParams.priority && ['low', 'normal', 'high'].includes(queryParams.priority)) {
        priority = queryParams.priority as 'low' | 'normal' | 'high';
      }
      
      logger.info('Query parameters validated', { 
        query: validatedQuery, 
        priority 
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

    // Generate cache key with priority information
    const baseCacheKey = `products:${JSON.stringify(validatedQuery)}`;
    const cacheKey = `${baseCacheKey}:${priority}`;
    
    // Check LRU cache first
    const cacheStartTime = performance.now();
    const cachedEntry = lruCache.get<Product[]>(cacheKey, requestId);
    const cacheCheckDuration = Math.round((performance.now() - cacheStartTime) * 100) / 100;
    
    let products: Product[];
    let fromCache = false;
    let dbDuration = 0;
    let wasEvicted = false;
    const cacheMetrics = lruCache.getMetrics();
    
    if (cachedEntry) {
      // LRU cache hit - serve cached data and update access order
      products = cachedEntry.data;
      fromCache = true;
      
      logger.info('LRU cache hit - serving cached data', {
        cacheKey,
        cachedAt: cachedEntry.cachedAt,
        lastAccess: cachedEntry.lastAccess,
        age: Math.round((Date.now() - new Date(cachedEntry.cachedAt).getTime()) / 1000)
      });
      
    } else {
      // LRU cache miss - could be never cached or evicted due to LRU policy
      logger.info('LRU cache miss - fetching from database', { 
        cacheKey,
        reason: 'miss-or-evicted'
      });
      
      const dbStartTime = performance.now();
      try {
        products = await supabase.getProducts(validatedQuery, requestId);
        dbDuration = Math.round((performance.now() - dbStartTime) * 100) / 100;
        
        // Determine TTL based on priority
        const priorityTTL = {
          low: 60,      // 1 minute for low priority
          normal: 300,  // 5 minutes for normal priority
          high: 900     // 15 minutes for high priority
        };
        
        // Cache the fresh data with priority-based TTL
        const cacheSuccess = lruCache.set(cacheKey, products, priorityTTL[priority], requestId);
        
        if (cacheSuccess) {
          logger.info('Data cached with LRU policy', { 
            cacheKey, 
            priority,
            ttl: priorityTTL[priority], 
            productCount: products.length,
            cacheSize: lruCache.getMetrics().size
          });
        } else {
          logger.warn('Failed to cache data in LRU cache', { cacheKey });
          wasEvicted = true; // Likely due to memory constraints
        }
        
      } catch (dbError) {
        logger.error('Database fetch failed during LRU cache miss', dbError as Error);
        throw dbError;
      }
    }
    
    const totalDuration = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Calculate cache efficiency metrics
    const cacheAge = fromCache 
      ? Math.round((Date.now() - new Date(cachedEntry!.cachedAt).getTime()) / 1000)
      : 0;
    
    logger.info('Request completed successfully', {
      productCount: products.length,
      duration: totalDuration,
      fromCache,
      cacheAge,
      priority,
      cacheMetrics: {
        hitRate: cacheMetrics.hitRate,
        size: cacheMetrics.size,
        memoryUsage: cacheMetrics.memoryUsage
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

    // For LRU cache, we use different cache control strategy
    // High-priority items get longer cache times, low-priority shorter
    const maxAge = fromCache ? Math.max(30, 300 - cacheAge) : 300;
    const staleWhileRevalidate = priority === 'high' ? 120 : 60;

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        
        // Adaptive cache control based on LRU policy and priority
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        
        // LRU-specific performance headers
        'X-Cache-Status': fromCache ? 'HIT' : (wasEvicted ? 'EVICTED' : 'MISS'),
        'X-Cache-Policy': 'LRU',
        'X-Cache-Priority': priority,
        'X-Cache-Hit-Rate': `${cacheMetrics.hitRate.toFixed(1)}%`,
        'X-Cache-Size': cacheMetrics.size.toString(),
        'X-Cache-Memory-Usage': `${Math.round(cacheMetrics.memoryUsage / 1024)}KB`,
        'X-Cache-Age': fromCache ? `${cacheAge}s` : '0s',
        'X-Response-Time': `${totalDuration}ms`,
        'X-Cache-Check-Time': `${cacheCheckDuration}ms`,
        'X-DB-Time': `${dbDuration}ms`,
        'X-From-Cache': fromCache.toString(),
        
        // Indicate if this was a high-value cache operation
        'X-Cache-Efficiency': fromCache ? 'optimal' : (priority === 'high' ? 'warming' : 'standard'),
        
        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'X-Cache-Status, X-Cache-Hit-Rate, X-Cache-Policy, X-Response-Time',
        
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });

  } catch (error) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Handle specific error types (same pattern as other endpoints)
    if (error instanceof ValidationError) {
      logger.error('Validation error in smart-memory endpoint', error);
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
      logger.error('Database timeout in smart-memory endpoint', error);
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
      logger.error('Database error in smart-memory endpoint', error);
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
    logger.error('Unexpected error in smart-memory endpoint', error as Error);
    
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}