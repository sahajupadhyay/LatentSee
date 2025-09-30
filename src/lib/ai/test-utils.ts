import { aiService } from '@/lib/ai';
import type { PerformanceMetrics } from '@/lib/ai/types';

/**
 * AI Services Test Utility
 * 
 * Simple test functions to verify AI functionality is working
 * with the configured OpenAI API key.
 */

export async function testAIServices(): Promise<{
  isAvailable: boolean;
  budgetStatus: any;
  testAnalysis?: any;
  error?: string;
}> {
  try {
    // Check if AI services are available
    const isAvailable = aiService.isAvailable();
    
    // Get budget status
    const budgetStatus = aiService.getBudgetStatus();
    
    if (!isAvailable) {
      return {
        isAvailable: false,
        budgetStatus,
        error: 'AI services not available - check API key configuration'
      };
    }

    // Create sample metrics for testing
    const sampleMetrics: PerformanceMetrics[] = [
      {
        responseTime: 150,
        cacheStatus: 'HIT',
        hitRate: 85,
        endpoint: '/api/test-data',
        consistencyModel: 'neural_cache',
        timestamp: new Date().toISOString(),
        errorOccurred: false
      },
      {
        responseTime: 200,
        cacheStatus: 'HIT',
        hitRate: 90,
        endpoint: '/api/test-data',
        consistencyModel: 'smart_memory',
        timestamp: new Date().toISOString(),
        errorOccurred: false
      },
      {
        responseTime: 400,
        cacheStatus: 'MISS',
        hitRate: 100,
        endpoint: '/api/test-data',
        consistencyModel: 'neural_authority',
        timestamp: new Date().toISOString(),
        errorOccurred: false
      }
    ];

    // Test AI analysis with a small, cost-effective operation
    const testAnalysis = await aiService.analyzePerformance(sampleMetrics, {
      analysisType: 'quick',
      includePatterns: false,
      includeAnomalies: false
    });

    return {
      isAvailable: true,
      budgetStatus,
      testAnalysis: testAnalysis ? {
        insightsCount: testAnalysis.insights.length,
        recommendationsCount: testAnalysis.recommendations.length,
        patternsCount: testAnalysis.patterns.length,
        anomaliesCount: testAnalysis.anomalies.length,
        confidence: testAnalysis.confidence,
        analysisTimestamp: testAnalysis.analysisTimestamp
      } : null
    };

  } catch (error) {
    console.error('AI services test failed:', error);
    return {
      isAvailable: false,
      budgetStatus: aiService.getBudgetStatus(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testBudgetTracking(): Promise<{
  canAffordSmallOperation: boolean;
  canAffordLargeOperation: boolean;
  budgetRemaining: number;
  usageSummary: any;
}> {
  // Test small operation affordability (typical quick analysis)
  const smallOp = aiService.canAffordOperation('gpt-4o-mini', {
    prompt: 200,
    completion: 100
  });

  // Test large operation affordability (detailed analysis)
  const largeOp = aiService.canAffordOperation('gpt-4o-mini', {
    prompt: 1000,
    completion: 500
  });

  const budgetStatus = aiService.getBudgetStatus();
  const usageSummary = aiService.getUsageSummary();

  return {
    canAffordSmallOperation: smallOp.canAfford,
    canAffordLargeOperation: largeOp.canAfford,
    budgetRemaining: budgetStatus.remaining,
    usageSummary: {
      totalCost: usageSummary.totalCost,
      totalRequests: usageSummary.totalRequests,
      budgetUtilization: usageSummary.budgetUtilization
    }
  };
}