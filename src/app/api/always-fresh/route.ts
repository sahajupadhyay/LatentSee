import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logger';
import { 
  GetProductsQuerySchema, 
  DatabaseError, 
  ValidationError, 
  TimeoutError,
  ApiResponse 
} from '@/lib/types';

/**
 * Always Fresh API Route - Strong Consistency Model
 * 
 * This endpoint provides strongly consistent data by querying the master database
 * directly without any caching layers. It demonstrates the "consistency" side
 * of the CAP theorem trade-off.
 * 
 * Features:
 * - Input validation with Zod schemas
 * - Comprehensive error handling
 * - Request/response logging
 * - Timeout protection
 * - Proper HTTP status codes
 * - CORS headers for cross-origin requests
 * - Request correlation IDs
 * 
 * @swagger
 * /api/always-fresh:
 *   get:
 *     summary: Fetch products with strong consistency
 *     description: Returns the most up-to-date product data directly from the master database
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of products to skip (pagination)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter products by category
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad Request - Invalid query parameters
 *       500:
 *         description: Internal Server Error
 *       503:
 *         description: Service Unavailable - Database connection failed
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = uuidv4();
  const logger = createLogger(requestId);
  const startTime = performance.now();

  // Extract request metadata for logging
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor || realIp || 'unknown';

  logger.info('Processing always-fresh request', {
    userAgent,
    clientIp,
    url: request.url
  });

  try {
    // Check for e-commerce mode requests
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');
    const loadAll = url.searchParams.get('loadAll') === 'true';
    
    if (productId) {
      // Single product mode - e-commerce demo with delay for "Always Fresh"
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500)); // 2-3.5s delay
      
      const product = await supabase.getProductById(productId, requestId);
      
      const duration = Math.round((performance.now() - startTime) * 100) / 100;
      
      logger.info('Single product request completed', {
        productId,
        duration,
        found: !!product
      });

      return NextResponse.json(
        {
          product,
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            duration,
            mode: 'fresh',
            served_from_cache: false,
            is_fresh: true
          }
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Cache-Policy': 'NONE',
            'X-Response-Time': `${duration}ms`,
            'X-From-Cache': 'false',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Parse and validate query parameters for list view
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    let validatedQuery;
    try {
      validatedQuery = GetProductsQuerySchema.parse(queryParams);
      logger.info('Query parameters validated', { query: validatedQuery });
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
              'X-Request-ID': requestId,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }
      throw error; // Re-throw unexpected errors
    }

    // Fetch data from database with strong consistency
    const products = await supabase.getProducts(validatedQuery, requestId);
    
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    
    logger.info('Request completed successfully', {
      productCount: products.length,
      duration,
      query: validatedQuery
    });

    const response: ApiResponse = {
      data: products,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        duration,
        count: products.length
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        // Strong consistency: no caching
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Performance headers
        'X-Response-Time': `${duration}ms`,
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });

  } catch (error) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof ValidationError) {
      logger.error('Validation error in always-fresh endpoint', error);
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
            'X-Request-ID': requestId
          }
        }
      );
    }

    if (error instanceof TimeoutError) {
      logger.error('Database timeout in always-fresh endpoint', error);
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
            'Retry-After': '5'
          }
        }
      );
    }

    if (error instanceof DatabaseError) {
      logger.error('Database error in always-fresh endpoint', error);
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
            'Retry-After': '10'
          }
        }
      );
    }

    // Handle unexpected errors
    logger.error('Unexpected error in always-fresh endpoint', error as Error);
    
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
          'X-Request-ID': requestId
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