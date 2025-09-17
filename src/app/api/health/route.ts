import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logger';

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
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET(): Promise<NextResponse> {
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

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Request-ID': requestId
    }
  });
}