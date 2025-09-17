import { z } from 'zod';

/**
 * Database Types - Strongly typed schema definitions
 */

// Product schema validation
export const ProductSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  price: z.number().int().min(0, 'Price must be non-negative'), // Price in paise/cents
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
  inventory: z.number().int().min(0, 'Inventory cannot be negative').default(100),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
  image_url: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  brand: z.string().max(100).optional(),
  updated_at: z.string().datetime('Invalid datetime format'),
  created_at: z.string().datetime('Invalid datetime format'),
  version: z.number().int().min(1, 'Version must be positive integer')
});

// API Request/Response schemas
export const GetProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().max(100).optional()
});

export const ApiResponseSchema = z.object({
  data: z.array(ProductSchema).optional(),
  error: z.string().optional(),
  metadata: z.object({
    requestId: z.string().uuid(),
    timestamp: z.string().datetime(),
    duration: z.number().min(0),
    count: z.number().int().min(0).optional()
  })
});

// Single product response for e-commerce demo
export const SingleProductResponseSchema = z.object({
  product: ProductSchema.optional(),
  error: z.string().optional(),
  metadata: z.object({
    requestId: z.string().uuid(),
    timestamp: z.string().datetime(),
    duration: z.number().min(0),
    mode: z.string().optional(),
    served_from_cache: z.boolean().optional(),
    is_fresh: z.boolean().optional()
  })
});

// Error types for better error handling
export class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// TypeScript types derived from Zod schemas
export type Product = z.infer<typeof ProductSchema>;
export type GetProductsQuery = z.infer<typeof GetProductsQuerySchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type SingleProductResponse = z.infer<typeof SingleProductResponseSchema>;

// Configuration types
export interface DatabaseConfig {
  url: string;
  anonKey: string;
  maxRetries: number;
  timeoutMs: number;
}

export interface RequestMetadata {
  requestId: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
}