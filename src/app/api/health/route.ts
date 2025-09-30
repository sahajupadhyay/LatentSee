import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logger';
import { addRateLimitHeaders, getRateLimitStats } from '@/lib/rateLimit';
import { applySecurityHeaders, createPreflightResponse, SECURITY_PROFILES } from '@/lib/security';

/**
 * Health Check Endpoint
 * 
 * Provides system health status including database connectivity,
 * response times, and service availability. Essential for monitoring
 * and alerting in production environments.
 */

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  requestId: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    api: {
      status: 'up';
      responseTime: number;
    };
    rateLimit: {
      status: 'operational';
      stats: {
        totalKeys: number;
        activeKeys: number;
        memoryUsage: number;
      };
    };
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = uuidv4();
  const logger = createLogger(requestId);
  const checkStartTime = performance.now();

  logger.info('Running health check');

  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: {
        status: 'down'
      },
      api: {
        status: 'up',
        responseTime: 0
      },
      rateLimit: {
        status: 'operational',
        stats: getRateLimitStats()
      }
    },
    uptime: Math.round((Date.now() - startTime) / 1000)
  };

  // Check database connectivity
  try {
    const dbStartTime = performance.now();
    const isHealthy = await supabase.healthCheck(requestId);
    const dbResponseTime = Math.round((performance.now() - dbStartTime) * 100) / 100;

    response.checks.database = {
      status: isHealthy ? 'up' : 'down',
      responseTime: dbResponseTime
    };

    if (!isHealthy) {
      response.status = 'degraded';
      logger.warn('Database health check failed');
    }
  } catch (error) {
    response.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
    response.status = 'unhealthy';
    logger.error('Database health check error', error as Error);
  }

  // Calculate total API response time
  response.checks.api.responseTime = Math.round((performance.now() - checkStartTime) * 100) / 100;

  // Determine overall status
  if (response.checks.database.status === 'down') {
    response.status = 'unhealthy';
  }

  const httpStatus = response.status === 'healthy' ? 200 : 
                    response.status === 'degraded' ? 200 : 503;

  logger.info('Health check completed', {
    status: response.status,
    databaseStatus: response.checks.database.status,
    responseTime: response.checks.api.responseTime
  });

  const healthResponse = NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId
    }
  });

  // Apply security headers using the PUBLIC_API profile
  return applySecurityHeaders(healthResponse, request, SECURITY_PROFILES.PUBLIC_API);
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return createPreflightResponse(request, SECURITY_PROFILES.PUBLIC_API);
}