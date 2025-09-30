import type { PerformanceMetrics } from '@/lib/ai/types';

/**
 * AI Integration Utilities
 * 
 * Helper functions to integrate AI services with existing
 * ExecutionPage components and convert data formats.
 */

interface ExecutionMetric {
  modelName: 'Neural Authority' | 'Neural Cache' | 'Smart Memory';
  endpoint: string;
  responseTime: number;
  cacheStatus: string;
  cachePolicy: string;
  hitRate: number;
  fromCache: boolean;
  efficiency: string;
  requestId: string;
  dataCount: number;
}

interface CacheMetrics {
  status?: string;
  policy?: string;
  hitRate?: string;
  responseTime?: string;
  fromCache?: string;
  efficiency?: string;
}

/**
 * Convert ExecutionPage metrics to AI PerformanceMetrics format
 */
export function convertToAIMetrics(
  executionMetrics: ExecutionMetric[],
  cacheMetrics?: CacheMetrics,
  responseTime?: number
): PerformanceMetrics[] {
  return executionMetrics.map(metric => {
    // Map model names to consistency model types
    const consistencyModelMap = {
      'Neural Authority': 'neural_authority' as const,
      'Neural Cache': 'neural_cache' as const,
      'Smart Memory': 'smart_memory' as const
    };

    // Map cache status to standard format
    const cacheStatusMap: Record<string, 'HIT' | 'MISS' | 'STALE' | 'EXPIRED'> = {
      'HIT': 'HIT',
      'MISS': 'MISS',
      'hit': 'HIT',
      'miss': 'MISS',
      'stale': 'STALE',
      'expired': 'EXPIRED',
      'STALE': 'STALE',
      'EXPIRED': 'EXPIRED'
    };

    return {
      responseTime: responseTime || metric.responseTime,
      cacheStatus: cacheStatusMap[metric.cacheStatus] || 'MISS',
      hitRate: metric.hitRate,
      endpoint: metric.endpoint,
      consistencyModel: consistencyModelMap[metric.modelName],
      timestamp: new Date().toISOString(),
      dataSize: metric.dataCount,
      errorOccurred: false
    };
  });
}

/**
 * Create a single AI metric from current execution data
 */
export function createAIMetricFromExecution(
  modelName: 'Neural Authority' | 'Neural Cache' | 'Smart Memory',
  endpoint: string,
  responseTime: number,
  cacheMetrics: CacheMetrics | null,
  dataCount: number = 0,
  errorOccurred: boolean = false
): PerformanceMetrics {
  const consistencyModelMap = {
    'Neural Authority': 'neural_authority' as const,
    'Neural Cache': 'neural_cache' as const,
    'Smart Memory': 'smart_memory' as const
  };

  // Parse hit rate from cache metrics
  const hitRate = cacheMetrics?.hitRate 
    ? parseFloat(cacheMetrics.hitRate.replace('%', '')) 
    : 0;

  // Determine cache status
  let cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'EXPIRED' = 'MISS';
  if (cacheMetrics?.status) {
    const statusMap: Record<string, 'HIT' | 'MISS' | 'STALE' | 'EXPIRED'> = {
      'HIT': 'HIT',
      'MISS': 'MISS',
      'hit': 'HIT',
      'miss': 'MISS',
      'stale': 'STALE',
      'expired': 'EXPIRED',
      'STALE': 'STALE',
      'EXPIRED': 'EXPIRED'
    };
    cacheStatus = statusMap[cacheMetrics.status] || 'MISS';
  }

  return {
    responseTime,
    cacheStatus,
    hitRate,
    endpoint,
    consistencyModel: consistencyModelMap[modelName],
    timestamp: new Date().toISOString(),
    dataSize: dataCount,
    errorOccurred
  };
}

/**
 * Check if enough metrics are available for meaningful AI analysis
 */
export function hasEnoughMetricsForAnalysis(metrics: PerformanceMetrics[]): boolean {
  return metrics.length >= 2; // Need at least 2 metrics for comparison
}

/**
 * Get AI analysis button text based on metrics count and budget
 */
export function getAIAnalysisButtonText(
  metricsCount: number,
  budgetStatus: 'safe' | 'warning' | 'critical' | 'exceeded'
): { text: string; disabled: boolean; tooltip?: string } {
  if (budgetStatus === 'exceeded') {
    return {
      text: 'AI Budget Exceeded',
      disabled: true,
      tooltip: 'AI analysis unavailable - budget limit reached'
    };
  }

  if (metricsCount === 0) {
    return {
      text: 'AI Insights',
      disabled: true,
      tooltip: 'Run some tests first to generate AI insights'
    };
  }

  if (metricsCount === 1) {
    return {
      text: 'AI Insights (Need More Data)',
      disabled: true,
      tooltip: 'At least 2 test results needed for meaningful AI analysis'
    };
  }

  if (budgetStatus === 'critical') {
    return {
      text: 'AI Insights (Budget Low)',
      disabled: false,
      tooltip: 'Budget is low but analysis is still available'
    };
  }

  return {
    text: `AI Insights (${metricsCount} tests)`,
    disabled: false,
    tooltip: 'Get AI-powered performance insights and recommendations'
  };
}

/**
 * Format AI confidence as percentage with color
 */
export function formatConfidence(confidence: number): {
  percentage: string;
  color: string;
  description: string;
} {
  const percentage = `${Math.round(confidence * 100)}%`;
  
  if (confidence >= 0.8) {
    return {
      percentage,
      color: 'text-green-400',
      description: 'High confidence'
    };
  } else if (confidence >= 0.6) {
    return {
      percentage,
      color: 'text-yellow-400',
      description: 'Medium confidence'
    };
  } else {
    return {
      percentage,
      color: 'text-orange-400',
      description: 'Low confidence'
    };
  }
}

/**
 * Generate sample AI insights for testing (when AI is not available)
 */
export function generateSampleAIInsights(metrics: PerformanceMetrics[]) {
  return {
    insights: [
      {
        id: 'sample_1',
        type: 'performance' as const,
        title: 'Neural Cache shows optimal performance',
        description: 'Based on your tests, Neural Cache provides the best balance of speed and reliability for your workload.',
        confidence: 0.85,
        impact: 'high' as const,
        category: 'optimization' as const
      },
      {
        id: 'sample_2', 
        type: 'caching' as const,
        title: 'Cache hit rate varies by model',
        description: 'Smart Memory achieves higher cache hit rates but with increased latency compared to Neural Cache.',
        confidence: 0.92,
        impact: 'medium' as const,
        category: 'analysis' as const
      }
    ],
    recommendations: [
      {
        id: 'rec_1',
        category: 'optimization' as const,
        title: 'Consider Neural Cache for this workload',
        description: 'Your performance pattern suggests Neural Cache would be optimal for this use case.',
        priority: 'high' as const,
        expectedImprovement: '20% faster response times',
        implementationComplexity: 'easy' as const,
        steps: [
          'Switch to Neural Cache endpoint',
          'Monitor performance for 24 hours',
          'Adjust TTL settings if needed'
        ]
      }
    ],
    patterns: [
      {
        pattern: 'consistent' as const,
        confidence: 0.88,
        description: 'Performance remains stable across different consistency models',
        metrics: {
          avgResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
          avgHitRate: metrics.reduce((sum, m) => sum + m.hitRate, 0) / metrics.length,
          volatilityScore: 0.15
        },
        timeRange: {
          start: metrics[0]?.timestamp || new Date().toISOString(),
          end: metrics[metrics.length - 1]?.timestamp || new Date().toISOString()
        }
      }
    ],
    anomalies: [],
    confidence: 0.87,
    analysisTimestamp: new Date().toISOString()
  };
}