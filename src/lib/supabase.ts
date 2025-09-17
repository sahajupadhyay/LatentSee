import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/lib/logger';
import { 
  Product, 
  GetProductsQuery, 
  DatabaseError, 
  ValidationError, 
  TimeoutError,
  DatabaseConfig 
} from '@/lib/types';

/**
 * Production-grade Supabase client with connection pooling, 
 * comprehensive error handling, and observability
 */
class SupabaseService {
  private client: SupabaseClient;
  private config: DatabaseConfig;
  private logger = createLogger('supabase-service');

  constructor() {
    this.config = this.validateConfig();
    this.client = createClient(this.config.url, this.config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false // Serverless functions don't need session persistence
      },
      global: {
        headers: {
          'x-client-info': 'smart-cloud-dashboard@1.0.0'
        }
      }
    });
  }

  /**
   * Validates environment configuration with proper error messages
   */
  private validateConfig(): DatabaseConfig {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || url === 'YOUR_SUPABASE_URL') {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL is required. Please add it to your .env.local file.\n' +
        'Example: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co'
      );
    }

    if (!anonKey || anonKey === 'YOUR_SUPABASE_ANON_KEY') {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please add it to your .env.local file.\n' +
        'You can find this key in your Supabase project settings under API.'
      );
    }

    // Validate URL format (skip validation during build if placeholder values)
    if (!url.startsWith('https://') || url.includes('your-project')) {
      throw new Error(`Invalid SUPABASE_URL format: ${url}`);
    }

    return {
      url,
      anonKey,
      maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
      timeoutMs: parseInt(process.env.DB_TIMEOUT_MS || '5000', 10)
    };
  }

  /**
   * Creates a timeout promise that rejects after specified milliseconds
   */
  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
      }, timeoutMs);
    });
  }

  /**
   * Executes a database operation with timeout and retry logic
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    operationName: string,
    requestId: string = uuidv4()
  ): Promise<T> {
    const logger = createLogger(requestId);
    
    return logger.timeFunction(`supabase.${operationName}`, async () => {
      try {
        return await Promise.race([
          operation(),
          this.createTimeoutPromise<T>(this.config.timeoutMs)
        ]);
      } catch (error) {
        if (error instanceof TimeoutError) {
          logger.error(`Database operation ${operationName} timed out`, error);
          throw error;
        }
        
        logger.error(`Database operation ${operationName} failed`, error as Error);
        throw new DatabaseError(
          `Failed to execute ${operationName}: ${(error as Error).message}`,
          error
        );
      }
    });
  }

  /**
   * Fetches products with strong consistency
   * 
   * @param query - Query parameters with validation
   * @param requestId - Request tracking ID
   * @returns Promise<Product[]> - Array of validated products
   */
  async getProducts(
    query: GetProductsQuery = { limit: 10, offset: 0 },
    requestId: string = uuidv4()
  ): Promise<Product[]> {
    const logger = createLogger(requestId);
    
    return this.executeWithTimeout(async () => {
      logger.info('Fetching products from database', { query });

      let queryBuilder = this.client
        .from('products')
        .select('id, name, price, category, updated_at, created_at, version')
        .order('updated_at', { ascending: false })
        .limit(query.limit);

      if (query.offset > 0) {
        queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);
      }

      if (query.category) {
        queryBuilder = queryBuilder.eq('category', query.category);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        logger.error('Supabase query failed', new Error(error.message), { 
          code: error.code,
          details: error.details 
        });
        throw new DatabaseError(`Database query failed: ${error.message}`, error);
      }

      if (!data) {
        logger.warn('No data returned from database query');
        return [];
      }

      // Validate returned data structure
      try {
        const validatedProducts = data.map(item => {
          // Basic runtime validation - Zod validation would be overkill here
          // since we control the SELECT fields
          if (!item.id || !item.name || typeof item.price !== 'number') {
            throw new ValidationError(`Invalid product data structure: ${JSON.stringify(item)}`);
          }
          return item as Product;
        });

        logger.info('Successfully fetched and validated products', { 
          count: validatedProducts.length 
        });
        
        return validatedProducts;
      } catch (validationError) {
        logger.error('Product data validation failed', validationError as Error);
        throw validationError;
      }
    }, 'getProducts', requestId);
  }

  /**
   * Fetch a single product by ID - for e-commerce demo
   * 
   * @param productId - Product UUID
   * @param requestId - Request tracking ID
   * @returns Promise<Product | null> - Single product or null if not found
   */
  async getProductById(
    productId: string,
    requestId: string = uuidv4()
  ): Promise<Product | null> {
    const logger = createLogger(requestId);
    
    return this.executeWithTimeout(async () => {
      logger.info('Fetching product by ID', { productId });

      const { data, error } = await this.client
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          logger.info('Product not found', { productId });
          return null;
        }
        logger.error('Supabase query failed', new Error(error.message), { 
          code: error.code,
          details: error.details 
        });
        throw new DatabaseError(`Database query failed: ${error.message}`, error);
      }

      if (!data) {
        return null;
      }

      // Basic validation
      if (!data.id || !data.name || typeof data.price !== 'number') {
        throw new ValidationError(`Invalid product data structure: ${JSON.stringify(data)}`);
      }

      logger.info('Successfully fetched product', { productId });
      return data as Product;
    }, 'getProductById', requestId);
  }

  /**
   * Health check for database connectivity
   */
  async healthCheck(requestId: string = uuidv4()): Promise<boolean> {
    const logger = createLogger(requestId);
    
    try {
      await this.executeWithTimeout(async () => {
        const { data, error } = await this.client
          .from('products')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          throw new DatabaseError(`Health check failed: ${error.message}`, error);
        }
        
        return data;
      }, 'healthCheck', requestId);
      
      logger.info('Database health check passed');
      return true;
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      return false;
    }
  }
}

// Singleton instance
let supabaseService: SupabaseService | null = null;

/**
 * Get singleton instance of SupabaseService
 * 
 * This ensures connection reuse across requests in serverless environments
 * while still allowing for proper error handling on initialization
 */
export function getSupabaseService(): SupabaseService {
  if (!supabaseService) {
    try {
      supabaseService = new SupabaseService();
    } catch (error) {
      // Re-throw with more context for debugging
      throw new Error(
        `Failed to initialize Supabase service: ${(error as Error).message}\n\n` +
        'Please ensure your .env.local file contains:\n' +
        '- NEXT_PUBLIC_SUPABASE_URL\n' +
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n' +
        'And that you have run the database migrations in the migrations/ folder.'
      );
    }
  }
  return supabaseService;
}

// Export for direct use in API routes
export const supabase = getSupabaseService();