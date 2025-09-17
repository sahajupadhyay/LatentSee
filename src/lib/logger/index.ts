import winston from 'winston';

/**
 * Production-grade structured logger
 * 
 * Features:
 * - Structured JSON logging for production
 * - Request ID correlation
 * - Multiple log levels
 * - Error serialization
 * - Performance timing
 */

// Create winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'smart-cloud-dashboard',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

/**
 * Enhanced logger with request context
 */
export class Logger {
  private requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId || 'system';
  }

  private formatMessage(message: string, meta?: Record<string, unknown>) {
    return {
      message,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      ...meta
    };
  }

  info(message: string, meta?: Record<string, unknown>) {
    logger.info(this.formatMessage(message, meta));
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    logger.error(this.formatMessage(message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...meta
    }));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    logger.warn(this.formatMessage(message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>) {
    logger.debug(this.formatMessage(message, meta));
  }

  /**
   * Time a function execution and log the duration
   */
  async timeFunction<T>(
    functionName: string, 
    fn: () => Promise<T>, 
    meta?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.info(`Function ${functionName} completed`, {
        duration: Math.round(duration * 100) / 100,
        ...meta
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Function ${functionName} failed`, error as Error, {
        duration: Math.round(duration * 100) / 100,
        ...meta
      });
      throw error;
    }
  }
}

export const createLogger = (requestId?: string) => new Logger(requestId);