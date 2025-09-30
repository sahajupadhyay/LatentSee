import { aiService } from './index';
import { createLogger } from '@/lib/logger';
import type {
  PerformanceMetrics,
  CacheOptimizationResult,
  AIRecommendation,
  ConsistencyModel
} from './types';

/**
 * AI-Driven Cache Optimizer
 * 
 * Analyzes caching patterns and performance metrics to provide
 * intelligent recommendations for optimal cache strategies,
 * TTL settings, and consistency model selection.
 */

export class CacheOptimizer {
  private logger = createLogger('cache-optimizer');
  private optimizationHistory: CacheOptimizationResult[] = [];
  private readonly MAX_HISTORY_SIZE = 50;

  constructor() {
    this.logger.info('Cache Optimizer initialized with AI capabilities');
  }

  /**
   * Get AI-powered cache optimization recommendations
   */
  async optimizeCache(
    metrics: PerformanceMetrics[],
    context?: {
      currentModel?: ConsistencyModel;
      userPreferences?: {
        prioritizeLatency?: boolean;
        prioritizeConsistency?: boolean;
        acceptableStaleTime?: number;
      };
      workloadType?: 'read-heavy' | 'write-heavy' | 'balanced';
    }
  ): Promise<CacheOptimizationResult | null> {
    if (metrics.length === 0) {
      this.logger.warn('No metrics provided for cache optimization');
      return null;
    }

    this.logger.info('Starting cache optimization analysis', {
      metricsCount: metrics.length,
      currentModel: context?.currentModel,
      workloadType: context?.workloadType
    });

    try {
      let optimization: CacheOptimizationResult | null = null;

      if (aiService.isAvailable()) {
        // Use AI for advanced optimization
        optimization = await this.getAIOptimization(metrics, context);
      }

      // Fallback to rule-based optimization if AI fails or is unavailable
      if (!optimization) {
        optimization = this.getRuleBasedOptimization(metrics, context);
      }

      // Store optimization result
      if (optimization) {
        this.optimizationHistory.push(optimization);
        
        // Maintain history size
        if (this.optimizationHistory.length > this.MAX_HISTORY_SIZE) {
          this.optimizationHistory = this.optimizationHistory.slice(-this.MAX_HISTORY_SIZE);
        }
      }

      return optimization;

    } catch (error) {
      this.logger.error('Cache optimization failed', error as Error);
      return this.getRuleBasedOptimization(metrics, context);
    }
  }

  /**
   * Get optimal consistency model recommendation
   */
  getOptimalConsistencyModel(
    metrics: PerformanceMetrics[],
    requirements: {
      maxAcceptableLatency?: number;
      minRequiredConsistency?: 'eventual' | 'strong';
      tolerateStaleData?: boolean;
    } = {}
  ): {
    recommendedModel: ConsistencyModel;
    confidence: number;
    rationale: string;
    expectedPerformance: {
      latency: number;
      hitRate: number;
      consistency: 'strong' | 'eventual';
    };
  } {
    const {
      maxAcceptableLatency = 1000,
      minRequiredConsistency = 'eventual',
      tolerateStaleData = true
    } = requirements;

    // Analyze current performance by model
    const modelAnalysis = this.analyzeModelPerformance(metrics);

    let recommendedModel: ConsistencyModel = 'smart_memory';
    let confidence = 0.7;
    let rationale = '';

    // Decision logic based on requirements
    if (minRequiredConsistency === 'strong') {
      recommendedModel = 'neural_authority';
      confidence = 0.9;
      rationale = 'Strong consistency required - Neural Authority ensures data accuracy';
    } else if (maxAcceptableLatency < 200 && tolerateStaleData) {
      recommendedModel = 'neural_cache';
      confidence = 0.8;
      rationale = 'Low latency prioritized with acceptable stale data tolerance';
    } else if (maxAcceptableLatency < 500) {
      recommendedModel = 'smart_memory';
      confidence = 0.85;
      rationale = 'Balanced approach with intelligent caching for moderate latency requirements';
    } else {
      // Analyze actual performance data
      const bestPerforming = this.findBestPerformingModel(modelAnalysis, {
        maxAcceptableLatency,
        minRequiredConsistency
      });
      
      recommendedModel = bestPerforming.model;
      confidence = bestPerforming.confidence;
      rationale = bestPerforming.rationale;
    }

    const expectedPerformance = this.getExpectedPerformance(recommendedModel, modelAnalysis);

    return {
      recommendedModel,
      confidence,
      rationale,
      expectedPerformance
    };
  }

  /**
   * Get cache configuration recommendations
   */
  getCacheConfigRecommendations(
    metrics: PerformanceMetrics[],
    model: ConsistencyModel
  ): {
    ttlRecommendations: {
      low_priority: number;
      normal_priority: number;
      high_priority: number;
    };
    cacheSize: {
      recommended: string;
      rationale: string;
    };
    evictionPolicy: {
      recommended: string;
      rationale: string;
    };
    additionalSettings: AIRecommendation[];
  } {
    const usage = this.analyzeCacheUsage(metrics);
    
    // TTL recommendations based on model and usage patterns
    let ttlRecommendations = {
      low_priority: 60,
      normal_priority: 300,
      high_priority: 900
    };

    if (model === 'neural_cache') {
      // TTL-based caching - more aggressive TTLs
      ttlRecommendations = {
        low_priority: 30,
        normal_priority: 120,
        high_priority: 600
      };
    } else if (model === 'smart_memory') {
      // LRU-based caching - longer TTLs for popular data
      ttlRecommendations = {
        low_priority: 120,
        normal_priority: 600,
        high_priority: 1800
      };
    }

    // Cache size recommendations
    const cacheSize = this.getCacheSizeRecommendation(usage);
    
    // Eviction policy recommendations
    const evictionPolicy = this.getEvictionPolicyRecommendation(model, usage);
    
    // Additional settings
    const additionalSettings = this.getAdditionalCacheSettings(metrics, model);

    return {
      ttlRecommendations,
      cacheSize,
      evictionPolicy,
      additionalSettings
    };
  }

  /**
   * Analyze cache performance trends
   */
  analyzeCachePerformance(
    metrics: PerformanceMetrics[],
    timeWindow: number = 24 // hours
  ): {
    trends: {
      hitRate: 'improving' | 'stable' | 'declining';
      latency: 'improving' | 'stable' | 'declining';
      efficiency: 'improving' | 'stable' | 'declining';
    };
    insights: string[];
    recommendations: string[];
    criticalIssues: string[];
  } {
    if (metrics.length < 10) {
      return {
        trends: { hitRate: 'stable', latency: 'stable', efficiency: 'stable' },
        insights: ['Insufficient data for trend analysis'],
        recommendations: ['Collect more performance data'],
        criticalIssues: []
      };
    }

    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    const recentMetrics = metrics.filter(m => new Date(m.timestamp) > cutoffTime);
    
    if (recentMetrics.length < 5) {
      return {
        trends: { hitRate: 'stable', latency: 'stable', efficiency: 'stable' },
        insights: ['Limited recent data for analysis'],
        recommendations: ['Increase testing frequency'],
        criticalIssues: []
      };
    }

    const trends = this.calculatePerformanceTrends(recentMetrics);
    const insights = this.generatePerformanceInsights(recentMetrics, trends);
    const recommendations = this.generatePerformanceRecommendations(recentMetrics, trends);
    const criticalIssues = this.identifyCriticalIssues(recentMetrics);

    return { trends, insights, recommendations, criticalIssues };
  }

  /**
   * Private helper methods
   */
  private async getAIOptimization(
    metrics: PerformanceMetrics[],
    context?: any
  ): Promise<CacheOptimizationResult | null> {
    try {
      const contextString = context ? JSON.stringify(context, null, 2) : 'General cache optimization';
      const optimization = await aiService.optimizeCache(metrics, contextString);
      
      if (optimization) {
        this.logger.info('AI cache optimization completed', {
          recommendedModel: optimization.optimizedStrategy.recommendedModel,
          expectedImprovement: optimization.improvements.overallEfficiency
        });
      }
      
      return optimization;
    } catch (error) {
      this.logger.error('AI cache optimization failed', error as Error);
      return null;
    }
  }

  private getRuleBasedOptimization(
    metrics: PerformanceMetrics[],
    context?: any
  ): CacheOptimizationResult {
    const currentStats = this.calculateCurrentStats(metrics);
    const optimalModel = this.getOptimalConsistencyModel(metrics, context?.userPreferences || {});
    
    return {
      currentStrategy: {
        model: context?.currentModel || 'unknown',
        efficiency: currentStats.efficiency,
        hitRate: currentStats.hitRate,
        averageLatency: currentStats.averageLatency
      },
      optimizedStrategy: {
        recommendedModel: optimalModel.recommendedModel,
        expectedHitRate: Math.min(100, currentStats.hitRate * 1.15),
        expectedLatency: Math.max(50, currentStats.averageLatency * 0.85),
        rationale: optimalModel.rationale
      },
      improvements: {
        latencyReduction: '15%',
        hitRateImprovement: '15%',
        overallEfficiency: '15%'
      }
    };
  }

  private analyzeModelPerformance(metrics: PerformanceMetrics[]): Record<ConsistencyModel, {
    averageLatency: number;
    averageHitRate: number;
    requestCount: number;
    errorRate: number;
  }> {
    const models: ConsistencyModel[] = ['neural_authority', 'neural_cache', 'smart_memory'];
    const analysis: Record<string, any> = {};

    models.forEach(model => {
      const modelMetrics = metrics.filter(m => m.consistencyModel === model);
      
      if (modelMetrics.length > 0) {
        analysis[model] = {
          averageLatency: this.calculateAverage(modelMetrics, 'responseTime'),
          averageHitRate: this.calculateAverage(modelMetrics, 'hitRate'),
          requestCount: modelMetrics.length,
          errorRate: modelMetrics.filter(m => m.errorOccurred).length / modelMetrics.length
        };
      } else {
        analysis[model] = {
          averageLatency: 0,
          averageHitRate: 0,
          requestCount: 0,
          errorRate: 0
        };
      }
    });

    return analysis;
  }

  private findBestPerformingModel(
    analysis: Record<string, any>,
    requirements: { maxAcceptableLatency: number; minRequiredConsistency: string }
  ): { model: ConsistencyModel; confidence: number; rationale: string } {
    const models: ConsistencyModel[] = ['neural_authority', 'neural_cache', 'smart_memory'];
    let bestModel: ConsistencyModel = 'smart_memory';
    let bestScore = 0;
    let rationale = 'Default balanced choice';

    models.forEach(model => {
      const stats = analysis[model];
      if (stats.requestCount === 0) return;

      // Calculate performance score
      let score = 0;
      
      // Latency score (lower is better)
      if (stats.averageLatency <= requirements.maxAcceptableLatency) {
        score += (requirements.maxAcceptableLatency - stats.averageLatency) / requirements.maxAcceptableLatency * 40;
      }
      
      // Hit rate score (higher is better)
      score += stats.averageHitRate * 0.4;
      
      // Error rate penalty
      score -= stats.errorRate * 20;
      
      // Request count bonus (more data = more confidence)
      score += Math.min(stats.requestCount * 0.1, 10);

      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
        rationale = `Best performing model based on latency (${stats.averageLatency.toFixed(0)}ms) and hit rate (${stats.averageHitRate.toFixed(1)}%)`;
      }
    });

    return {
      model: bestModel,
      confidence: Math.min(0.95, 0.6 + (bestScore / 100) * 0.35),
      rationale
    };
  }

  private getExpectedPerformance(model: ConsistencyModel, analysis: Record<string, any>) {
    const baseStats = analysis[model] || { averageLatency: 500, averageHitRate: 60 };
    
    const consistencyMap = {
      'neural_authority': 'strong' as const,
      'neural_cache': 'eventual' as const,
      'smart_memory': 'eventual' as const
    };

    return {
      latency: baseStats.averageLatency,
      hitRate: baseStats.averageHitRate,
      consistency: consistencyMap[model]
    };
  }

  private analyzeCacheUsage(metrics: PerformanceMetrics[]) {
    return {
      totalRequests: metrics.length,
      hitRate: this.calculateAverage(metrics, 'hitRate'),
      missRate: 100 - this.calculateAverage(metrics, 'hitRate'),
      averageLatency: this.calculateAverage(metrics, 'responseTime'),
      errorRate: metrics.filter(m => m.errorOccurred).length / metrics.length,
      peakUsageTimes: this.identifyPeakUsage(metrics)
    };
  }

  private getCacheSizeRecommendation(usage: any) {
    let size = 'medium';
    let rationale = 'Balanced cache size for general workloads';

    if (usage.hitRate > 80) {
      size = 'large';
      rationale = 'High hit rate indicates good caching - increase size to maintain performance';
    } else if (usage.hitRate < 40) {
      size = 'small';
      rationale = 'Low hit rate suggests cache inefficiency - smaller size may improve hit ratio';
    }

    return { recommended: size, rationale };
  }

  private getEvictionPolicyRecommendation(model: ConsistencyModel, usage: any) {
    const policies = {
      'neural_authority': 'None (no caching)',
      'neural_cache': 'TTL-based expiration',
      'smart_memory': 'LRU (Least Recently Used)'
    };

    return {
      recommended: policies[model],
      rationale: `Optimal for ${model} consistency model`
    };
  }

  private getAdditionalCacheSettings(metrics: PerformanceMetrics[], model: ConsistencyModel): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];

    if (model === 'neural_cache') {
      recommendations.push({
        id: `cache_setting_${Date.now()}_1`,
        category: 'configuration',
        title: 'Optimize TTL Values',
        description: 'Fine-tune TTL values based on data update frequency',
        priority: 'medium',
        expectedImprovement: 'Improved cache efficiency',
        implementationComplexity: 'easy',
        steps: ['Monitor data update patterns', 'Adjust TTL values accordingly', 'Test different TTL configurations']
      });
    }

    if (model === 'smart_memory') {
      recommendations.push({
        id: `cache_setting_${Date.now()}_2`,
        category: 'configuration',
        title: 'Tune LRU Cache Size',
        description: 'Optimize cache size based on memory constraints and hit rate',
        priority: 'medium',
        expectedImprovement: 'Better memory utilization',
        implementationComplexity: 'moderate',
        steps: ['Monitor memory usage', 'Analyze cache hit patterns', 'Adjust cache size limits']
      });
    }

    return recommendations;
  }

  private calculateCurrentStats(metrics: PerformanceMetrics[]) {
    return {
      efficiency: this.calculateAverage(metrics, 'hitRate') / 100,
      hitRate: this.calculateAverage(metrics, 'hitRate'),
      averageLatency: this.calculateAverage(metrics, 'responseTime')
    };
  }

  private calculateAverage(metrics: PerformanceMetrics[], field: keyof PerformanceMetrics): number {
    const values = metrics.map(m => Number(m[field])).filter(v => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculatePerformanceTrends(metrics: PerformanceMetrics[]) {
    const half = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, half);
    const secondHalf = metrics.slice(half);

    const hitRateTrend = this.comparePeriods(firstHalf, secondHalf, 'hitRate');
    const latencyTrend = this.comparePeriods(firstHalf, secondHalf, 'responseTime');
    
    // Calculate efficiency trend (combination of hit rate and latency)
    const firstEfficiency = this.calculateAverage(firstHalf, 'hitRate') / this.calculateAverage(firstHalf, 'responseTime');
    const secondEfficiency = this.calculateAverage(secondHalf, 'hitRate') / this.calculateAverage(secondHalf, 'responseTime');
    
    const efficiencyTrend = secondEfficiency > firstEfficiency * 1.05 ? 'improving' :
                           secondEfficiency < firstEfficiency * 0.95 ? 'declining' : 'stable';

    const latencyTrendAdjusted: 'improving' | 'stable' | 'declining' = 
      latencyTrend === 'improving' ? 'declining' : 
      latencyTrend === 'declining' ? 'improving' : 'stable';

    return {
      hitRate: hitRateTrend,
      latency: latencyTrendAdjusted,
      efficiency: efficiencyTrend as 'improving' | 'stable' | 'declining'
    };
  }

  private comparePeriods(first: PerformanceMetrics[], second: PerformanceMetrics[], field: keyof PerformanceMetrics): 'improving' | 'stable' | 'declining' {
    const firstAvg = this.calculateAverage(first, field);
    const secondAvg = this.calculateAverage(second, field);
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  private generatePerformanceInsights(metrics: PerformanceMetrics[], trends: any): string[] {
    const insights: string[] = [];
    
    if (trends.hitRate === 'declining') {
      insights.push('Cache hit rate is declining - consider reviewing cache configuration');
    }
    
    if (trends.latency === 'declining') {
      insights.push('Response times are increasing - investigate system performance');
    }
    
    if (trends.efficiency === 'improving') {
      insights.push('Overall cache efficiency is improving - current strategy is working well');
    }

    return insights;
  }

  private generatePerformanceRecommendations(metrics: PerformanceMetrics[], trends: any): string[] {
    const recommendations: string[] = [];
    
    if (trends.hitRate === 'declining') {
      recommendations.push('Review and optimize cache TTL settings');
      recommendations.push('Consider switching to smart_memory model for better hit rates');
    }
    
    if (trends.latency === 'declining') {
      recommendations.push('Enable or optimize caching strategy');
      recommendations.push('Consider neural_cache model for faster response times');
    }

    return recommendations;
  }

  private identifyCriticalIssues(metrics: PerformanceMetrics[]): string[] {
    const issues: string[] = [];
    
    const avgHitRate = this.calculateAverage(metrics, 'hitRate');
    const avgLatency = this.calculateAverage(metrics, 'responseTime');
    const errorRate = metrics.filter(m => m.errorOccurred).length / metrics.length;

    if (avgHitRate < 20) {
      issues.push('Critically low cache hit rate');
    }
    
    if (avgLatency > 2000) {
      issues.push('Unacceptably high response times');
    }
    
    if (errorRate > 0.1) {
      issues.push('High error rate detected');
    }

    return issues;
  }

  private identifyPeakUsage(metrics: PerformanceMetrics[]): string[] {
    // Simple peak usage identification
    if (metrics.length < 10) return [];
    
    const hourlyUsage: Record<number, number> = {};
    
    metrics.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourlyUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${hour}:59`);
    
    return peakHours;
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): CacheOptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * Clear optimization history
   */
  clearHistory(): void {
    this.optimizationHistory = [];
    this.logger.info('Cache optimization history cleared');
  }
}

// Export singleton instance  
export const cacheOptimizer = new CacheOptimizer();
export default cacheOptimizer;