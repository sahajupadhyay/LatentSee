/**
 * AI Service Types
 * 
 * TypeScript interfaces and types for AI-powered functionality
 * in LatentSee. Defines structures for performance analysis,
 * cache optimization, and intelligent insights.
 */

// Performance Analysis Types
export interface PerformanceMetrics {
  responseTime: number;
  cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'EXPIRED';
  hitRate: number;
  endpoint: string;
  consistencyModel: 'neural_authority' | 'neural_cache' | 'smart_memory';
  timestamp: string;
  dataSize?: number;
  errorOccurred?: boolean;
}

export interface PerformancePattern {
  pattern: 'consistent' | 'degrading' | 'improving' | 'volatile' | 'anomalous';
  confidence: number; // 0-1
  description: string;
  metrics: {
    avgResponseTime: number;
    avgHitRate: number;
    volatilityScore: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
}

// AI Analysis Results
export interface AIAnalysisResult {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  patterns: PerformancePattern[];
  anomalies: AIAnomaly[];
  confidence: number;
  analysisTimestamp: string;
}

export interface AIInsight {
  id: string;
  type: 'performance' | 'caching' | 'optimization' | 'anomaly';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: string;
  suggestedActions?: string[];
}

export interface AIRecommendation {
  id: string;
  category: 'cache_strategy' | 'performance_tuning' | 'configuration' | 'architecture';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  expectedImprovement: string;
  implementationComplexity: 'easy' | 'moderate' | 'complex';
  steps: string[];
}

export interface AIAnomaly {
  id: string;
  type: 'latency_spike' | 'cache_degradation' | 'error_increase' | 'pattern_deviation';
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  detectedAt: string;
  affectedMetrics: string[];
  possibleCauses: string[];
  recommendedActions: string[];
}

// Cache Optimization Types
export interface CacheOptimizationResult {
  currentStrategy: {
    model: string;
    efficiency: number;
    hitRate: number;
    averageLatency: number;
  };
  optimizedStrategy: {
    recommendedModel: 'neural_authority' | 'neural_cache' | 'smart_memory';
    expectedHitRate: number;
    expectedLatency: number;
    rationale: string;
  };
  improvements: {
    latencyReduction: string;
    hitRateImprovement: string;
    overallEfficiency: string;
  };
}

// AI Service Configuration
export interface AIServiceConfig {
  openaiApiKey: string;
  model: 'gpt-4o-mini' | 'gpt-3.5-turbo';
  maxTokens: number;
  temperature: number;
  enableCaching: boolean;
  analysisFrequency: 'real-time' | 'batched' | 'on-demand';
}

// AI Request/Response Types
export interface AIAnalysisRequest {
  metrics: PerformanceMetrics[];
  timeRange?: {
    start: string;
    end: string;
  };
  analysisType: 'performance' | 'caching' | 'anomaly' | 'comprehensive';
  context?: {
    userPreferences?: Record<string, any>;
    systemConfiguration?: Record<string, any>;
  };
}

export interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  context?: {
    metrics?: PerformanceMetrics[];
    insights?: AIInsight[];
  };
}

// Error Types
export interface AIServiceError {
  code: 'API_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'INSUFFICIENT_DATA' | 'NETWORK_ERROR';
  message: string;
  details?: any;
  retryable: boolean;
}

// Utility Types
export type AIAnalysisType = 'performance' | 'caching' | 'anomaly' | 'optimization' | 'comprehensive';
export type ConsistencyModel = 'neural_authority' | 'neural_cache' | 'smart_memory';
export type CacheStatus = 'HIT' | 'MISS' | 'STALE' | 'EXPIRED';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Confidence = number; // 0-1 scale