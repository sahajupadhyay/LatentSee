import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/lib/logger';
import { Product } from '@/lib/types';

/**
 * Production-Grade Cache Management System
 * 
 * Implements multiple caching strategies:
 * 1. TTL Cache - Time-based expiration (eventual consistency)
 * 2. LRU Cache - Least Recently Used eviction (smart memory management)
 * 
 * Features:
 * - Cache hit/miss tracking
 * - Performance metrics
 * - Cache warming and invalidation
 * - Thread-safe operations
 * - Memory usage monitoring
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memoryUsage: number;
  lastAccess?: string;
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
  accessCount: number;
  lastAccess: string;
}

/**
 * TTL Cache Implementation
 * 
 * Provides time-based cache expiration for demonstrating
 * eventual consistency with predictable staleness windows.
 */
export class TTLCache {
  private cache: NodeCache;
  private metrics: CacheMetrics;
  private logger = createLogger('ttl-cache');

  constructor(
    private readonly defaultTTL: number = 60, // 60 seconds default
    private readonly maxSize: number = 1000
  ) {
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      maxKeys: this.maxSize,
      useClones: false, // Better performance, but be careful with mutations
      deleteOnExpire: true,
      checkperiod: 10 // Check for expired keys every 10 seconds
    });

    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      memoryUsage: 0
    };

    // Set up cache event listeners for metrics
    this.cache.on('hit', (key) => {
      this.metrics.hits++;
      this.updateHitRate();
      this.logger.debug('Cache hit', { key, hitRate: this.metrics.hitRate });
    });

    this.cache.on('miss', (key) => {
      this.metrics.misses++;
      this.updateHitRate();
      this.logger.debug('Cache miss', { key, hitRate: this.metrics.hitRate });
    });

    this.cache.on('expired', (key) => {
      this.logger.debug('Cache entry expired', { key });
    });
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    this.metrics.size = this.cache.keys().length;
  }

  /**
   * Get value from cache with detailed metrics
   */
  get<T>(key: string, requestId: string = uuidv4()): CacheEntry<T> | null {
    const logger = createLogger(requestId);
    
    try {
      const value = this.cache.get<T>(key);
      const ttl = this.cache.getTtl(key);
      
      if (value !== undefined && ttl && ttl > Date.now()) {
        const entry: CacheEntry<T> = {
          data: value,
          cachedAt: new Date(Date.now() - (this.defaultTTL * 1000 - (ttl - Date.now()))).toISOString(),
          expiresAt: new Date(ttl).toISOString(),
          accessCount: 1, // Would need separate tracking for exact count
          lastAccess: new Date().toISOString()
        };

        this.metrics.lastAccess = entry.lastAccess;
        logger.debug('TTL cache hit', { key, expiresAt: entry.expiresAt });
        return entry;
      }

      logger.debug('TTL cache miss', { key, reason: value === undefined ? 'not-found' : 'expired' });
      return null;
    } catch (error) {
      logger.error('TTL cache get failed', error as Error, { key });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttlSeconds?: number, requestId: string = uuidv4()): boolean {
    const logger = createLogger(requestId);
    
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const success = this.cache.set(key, value, ttl);
      
      if (success) {
        logger.debug('TTL cache set', { key, ttl, expiresAt: new Date(Date.now() + ttl * 1000).toISOString() });
        this.updateMetrics();
      }
      
      return success;
    } catch (error) {
      logger.error('TTL cache set failed', error as Error, { key, ttlSeconds });
      return false;
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string, requestId: string = uuidv4()): boolean {
    const logger = createLogger(requestId);
    
    try {
      const deleted = this.cache.del(key) > 0;
      if (deleted) {
        logger.info('TTL cache entry invalidated', { key });
        this.updateMetrics();
      }
      return deleted;
    } catch (error) {
      logger.error('TTL cache invalidation failed', error as Error, { key });
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(requestId: string = uuidv4()): void {
    const logger = createLogger(requestId);
    
    try {
      const keyCount = this.cache.keys().length;
      this.cache.flushAll();
      this.updateMetrics();
      logger.info('TTL cache cleared', { clearedKeys: keyCount });
    } catch (error) {
      logger.error('TTL cache clear failed', error as Error);
    }
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.keys().length;
    // Estimate memory usage (rough calculation)
    this.metrics.memoryUsage = this.metrics.size * 1024; // Rough estimate in bytes
  }

  /**
   * Cache warming for products
   */
  async warmCache(products: Product[], requestId: string = uuidv4()): Promise<void> {
    const logger = createLogger(requestId);
    
    try {
      const cacheKey = 'products:latest';
      this.set(cacheKey, products, this.defaultTTL, requestId);
      logger.info('Cache warmed with products', { productCount: products.length, key: cacheKey });
    } catch (error) {
      logger.error('Cache warming failed', error as Error);
    }
  }
}

/**
 * LRU Cache Implementation
 * 
 * Implements Least Recently Used eviction policy for
 * intelligent memory management at edge locations.
 */
export class LRUCache {
  private cache: NodeCache;
  private accessOrder: Map<string, number>;
  private metrics: CacheMetrics;
  private logger = createLogger('lru-cache');

  constructor(
    private readonly maxSize: number = 100,
    private readonly defaultTTL: number = 300 // 5 minutes default
  ) {
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      maxKeys: this.maxSize,
      useClones: false,
      deleteOnExpire: true,
      checkperiod: 30
    });

    this.accessOrder = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      memoryUsage: 0
    };

    // Handle cache full scenario with LRU eviction
    this.cache.on('set', (key) => {
      this.updateAccessOrder(key);
      this.enforceMaxSize();
    });
  }

  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, Date.now());
  }

  private enforceMaxSize(): void {
    const keys = this.cache.keys();
    
    if (keys.length > this.maxSize) {
      // Sort by access time and remove least recently used
      const sortedKeys = Array.from(this.accessOrder.entries())
        .sort(([, timeA], [, timeB]) => timeA - timeB)
        .map(([key]) => key);

      const keysToRemove = sortedKeys.slice(0, keys.length - this.maxSize);
      
      keysToRemove.forEach(key => {
        this.cache.del(key);
        this.accessOrder.delete(key);
        this.logger.debug('LRU evicted entry', { key });
      });
    }
  }

  /**
   * Get value with LRU update
   */
  get<T>(key: string, requestId: string = uuidv4()): CacheEntry<T> | null {
    const logger = createLogger(requestId);
    
    try {
      const value = this.cache.get<T>(key);
      const ttl = this.cache.getTtl(key);
      
      if (value !== undefined && ttl && ttl > Date.now()) {
        // Update access order for LRU
        this.updateAccessOrder(key);
        
        const entry: CacheEntry<T> = {
          data: value,
          cachedAt: new Date(Date.now() - (this.defaultTTL * 1000 - (ttl - Date.now()))).toISOString(),
          expiresAt: new Date(ttl).toISOString(),
          accessCount: 1,
          lastAccess: new Date().toISOString()
        };

        this.metrics.hits++;
        this.updateHitRate();
        this.metrics.lastAccess = entry.lastAccess;
        
        logger.debug('LRU cache hit', { key, expiresAt: entry.expiresAt });
        return entry;
      }

      this.metrics.misses++;
      this.updateHitRate();
      logger.debug('LRU cache miss', { key });
      return null;
    } catch (error) {
      logger.error('LRU cache get failed', error as Error, { key });
      return null;
    }
  }

  /**
   * Set value with LRU management
   */
  set<T>(key: string, value: T, ttlSeconds?: number, requestId: string = uuidv4()): boolean {
    const logger = createLogger(requestId);
    
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const success = this.cache.set(key, value, ttl);
      
      if (success) {
        this.updateAccessOrder(key);
        this.enforceMaxSize();
        logger.debug('LRU cache set', { key, ttl });
        this.updateMetrics();
      }
      
      return success;
    } catch (error) {
      logger.error('LRU cache set failed', error as Error, { key });
      return false;
    }
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    this.metrics.size = this.cache.keys().length;
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.keys().length;
    this.metrics.memoryUsage = this.metrics.size * 1024;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear all entries
   */
  clear(requestId: string = uuidv4()): void {
    const logger = createLogger(requestId);
    
    try {
      const keyCount = this.cache.keys().length;
      this.cache.flushAll();
      this.accessOrder.clear();
      this.updateMetrics();
      logger.info('LRU cache cleared', { clearedKeys: keyCount });
    } catch (error) {
      logger.error('LRU cache clear failed', error as Error);
    }
  }
}

// Singleton instances for global use
export const ttlCache = new TTLCache(60, 1000); // 60 second TTL, 1000 max entries
export const lruCache = new LRUCache(100, 300); // 100 max entries, 5 minute TTL