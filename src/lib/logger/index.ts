/**
 * Universal Logging System
 * 
 * Browser-first logger that falls back to console methods.
 * No server-side dependencies that could cause module resolution issues.
 */

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private requestId?: string;

  constructor(requestId?: string) {
    this.requestId = requestId;
  }

  private formatMessage(level: string, message: string, context?: LogContext, error?: Error): any {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.requestId,
      ...context,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    return logEntry;
  }

  info(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('info', message, context);
    console.info(`[INFO]`, formattedMessage);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const formattedMessage = this.formatMessage('error', message, context, error);
    
    // If we have an actual error object, log it separately for better visibility
    if (error && error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        ...formattedMessage,
        errorDetails: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });
    } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
      // Handle non-Error objects that have content
      console.error(`[ERROR] ${message}`, {
        ...formattedMessage,
        errorObject: error
      });
    } else if (error) {
      // Handle empty objects or other falsy values
      console.error(`[ERROR] ${message}`, {
        ...formattedMessage,
        note: 'Error object was empty or invalid'
      });
    } else {
      // No error object provided
      console.error(`[ERROR] ${message}`, formattedMessage);
    }
  }

  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('warn', message, context);
    console.warn(`[WARN]`, formattedMessage);
  }

  debug(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('debug', message, context);
    console.debug(`[DEBUG]`, formattedMessage);
  }

  /**
   * Time a function execution and log the duration
   */
  async timeFunction<T>(
    functionName: string, 
    fn: () => Promise<T>, 
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.info(`Function ${functionName} completed`, {
        duration: Math.round(duration * 100) / 100,
        ...context
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Function ${functionName} failed`, error as Error, {
        duration: Math.round(duration * 100) / 100,
        ...context
      });
      throw error;
    }
  }
}

/**
 * Create a new logger instance with optional request correlation ID
 */
export function createLogger(requestId?: string): Logger {
  return new Logger(requestId);
}

// Default logger instance
export const logger = createLogger();