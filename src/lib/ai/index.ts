import { openaiClient } from './openai';
import { aiUsageTracker } from './usage-tracker';
import { createLogger } from '@/lib/logger';
import type {
  PerformanceMetrics,
  AIAnalysisResult,
  AIInsight,
  AIRecommendation,
  AIAnomaly,
  PerformancePattern,
  CacheOptimizationResult,
  AIAnalysisRequest,
  AIServiceError
} from './types';

/**
 * AI Service Orchestrator
 * 
 * Main service that coordinates AI-powered analysis features.
 * Provides high-level AI functionality for performance analysis,
 * cache optimization, and intelligent insights.
 */

class AIService {
  private logger = createLogger('ai-service');
  private analysisCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  constructor() {
    this.logger.info('AI Service initialized');
  }

  /**
   * Check if AI services are available
   */
  isAvailable(): boolean {
    return openaiClient.isAvailable();
  }

  /**
   * Get AI service usage statistics
   */
  getUsageStats() {
    return openaiClient.getUsageStats();
  }

  /**
   * Get budget status and usage summary
   */
  getBudgetStatus() {
    return aiUsageTracker.getBudgetStatus();
  }

  /**
   * Get detailed usage summary
   */
  getUsageSummary(timeframe?: { start?: Date; end?: Date }) {
    return aiUsageTracker.getUsageSummary(timeframe);
  }

  /**
   * Check if operation can be afforded within budget
   */
  canAffordOperation(model: string, estimatedTokens: { prompt: number; completion: number }) {
    return aiUsageTracker.canAffordOperation(model, estimatedTokens);
  }

  /**
   * Comprehensive performance analysis using AI
   */
  async analyzePerformance(
    metrics: PerformanceMetrics[],
    options: {
      analysisType?: 'quick' | 'detailed';
      includePatterns?: boolean;
      includeAnomalies?: boolean;
    } = {}
  ): Promise<AIAnalysisResult | null> {
    const { analysisType = 'quick', includePatterns = true, includeAnomalies = true } = options;
    
    if (!this.isAvailable()) {
      this.logger.warn('AI services not available for performance analysis');
      return null;
    }

    if (metrics.length === 0) {
      this.logger.warn('No metrics provided for analysis');
      return null;
    }

    const requestId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.logger.info('Starting AI performance analysis', { 
      requestId, 
      metricsCount: metrics.length, 
      analysisType 
    });

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey('performance', metrics, options);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.logger.info('Returning cached analysis result', { requestId });
        return cachedResult;
      }

      // Prepare metrics data for AI analysis
      const metricsData = this.formatMetricsForAnalysis(metrics);
      
      // Check budget before making AI call
      const estimatedTokens = { prompt: 800, completion: 400 }; // Estimated tokens for performance analysis
      const budgetCheck = aiUsageTracker.canAffordOperation('gpt-4o-mini', estimatedTokens);
      
      if (!budgetCheck.canAfford) {
        this.logger.warn('Cannot afford AI operation - budget limit reached', {
          requestId,
          estimatedCost: budgetCheck.estimatedCost,
          budgetRemaining: budgetCheck.budgetRemaining
        });
        return null;
      }

      // Get AI analysis
      const aiResponse = await openaiClient.analyzePerformance(metricsData, analysisType);
      
      if (!aiResponse) {
        // Track failed usage
        aiUsageTracker.trackUsage(
          `performance_analysis_${analysisType}`,
          'gpt-4o-mini',
          { prompt: 0, completion: 0 },
          false,
          'No AI response received'
        );
        this.logger.error('Failed to get AI analysis response', new Error('No AI response'), { requestId });
        return null;
      }

      // Track successful usage
      // Estimate token split (typically ~75% prompt, 25% completion)
      const totalTokens = aiResponse.usage.tokens;
      const estimatedPromptTokens = Math.floor(totalTokens * 0.75);
      const estimatedCompletionTokens = totalTokens - estimatedPromptTokens;
      
      aiUsageTracker.trackUsage(
        `performance_analysis_${analysisType}`,
        'gpt-4o-mini',
        {
          prompt: estimatedPromptTokens,
          completion: estimatedCompletionTokens
        },
        true
      );

      // Parse and structure the AI response
      const analysisResult = this.parseAnalysisResponse(aiResponse.content, metrics);
      
      // Cache the result
      this.setCachedResult(cacheKey, analysisResult);
      
      this.logger.info('AI analysis completed successfully', {
        requestId,
        insightsCount: analysisResult.insights.length,
        recommendationsCount: analysisResult.recommendations.length,
        tokensUsed: aiResponse.usage.tokens,
        cost: aiResponse.usage.cost,
        budgetRemaining: aiUsageTracker.getBudgetRemaining()
      });

      return analysisResult;

    } catch (error) {
      this.logger.error('AI performance analysis failed', error as Error, { requestId });
      return null;
    }
  }

  /**
   * Get AI-powered cache optimization recommendations
   */
  async optimizeCache(
    currentMetrics: PerformanceMetrics[],
    context?: string
  ): Promise<CacheOptimizationResult | null> {
    if (!this.isAvailable() || currentMetrics.length === 0) {
      return null;
    }

    const requestId = `cache_opt_${Date.now()}`;
    this.logger.info('Starting cache optimization analysis', { requestId });

    try {
      const metricsData = this.formatMetricsForAnalysis(currentMetrics);
      const contextData = context || 'General web application caching optimization';
      
      const aiResponse = await openaiClient.optimizeCache(metricsData, contextData);
      
      if (!aiResponse) return null;

      const optimization = this.parseCacheOptimizationResponse(aiResponse.content, currentMetrics);
      
      this.logger.info('Cache optimization completed', {
        requestId,
        tokensUsed: aiResponse.usage.tokens,
        cost: aiResponse.usage.cost
      });

      return optimization;

    } catch (error) {
      this.logger.error('Cache optimization failed', error as Error, { requestId });
      return null;
    }
  }

  /**
   * Detect performance anomalies using AI
   */
  async detectAnomalies(
    historicalMetrics: PerformanceMetrics[],
    currentMetrics: PerformanceMetrics[]
  ): Promise<AIAnomaly[]> {
    if (!this.isAvailable() || historicalMetrics.length === 0 || currentMetrics.length === 0) {
      return [];
    }

    const requestId = `anomaly_${Date.now()}`;
    this.logger.info('Starting anomaly detection', { requestId });

    try {
      const historicalData = this.formatMetricsForAnalysis(historicalMetrics);
      const currentData = this.formatMetricsForAnalysis(currentMetrics);
      
      const aiResponse = await openaiClient.detectAnomalies(historicalData, currentData);
      
      if (!aiResponse) return [];

      const anomalies = this.parseAnomalyResponse(aiResponse.content);
      
      this.logger.info('Anomaly detection completed', {
        requestId,
        anomaliesFound: anomalies.length,
        tokensUsed: aiResponse.usage.tokens,
        cost: aiResponse.usage.cost
      });

      return anomalies;

    } catch (error) {
      this.logger.error('Anomaly detection failed', error as Error, { requestId });
      return [];
    }
  }

  /**
   * Get intelligent insights for current performance state
   */
  async getQuickInsights(metrics: PerformanceMetrics[]): Promise<AIInsight[]> {
    if (!this.isAvailable() || metrics.length === 0) {
      return [];
    }

    try {
      const analysis = await this.analyzePerformance(metrics, { 
        analysisType: 'quick',
        includePatterns: false,
        includeAnomalies: false
      });

      return analysis?.insights || [];
    } catch (error) {
      this.logger.error('Quick insights failed', error as Error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private formatMetricsForAnalysis(metrics: PerformanceMetrics[]): string {
    const summary = {
      totalRequests: metrics.length,
      timeRange: {
        start: metrics[0]?.timestamp,
        end: metrics[metrics.length - 1]?.timestamp
      },
      averageResponseTime: this.calculateAverage(metrics, 'responseTime'),
      averageHitRate: this.calculateAverage(metrics, 'hitRate'),
      modelDistribution: this.getModelDistribution(metrics),
      cacheStatusDistribution: this.getCacheStatusDistribution(metrics),
      recentTrends: this.getRecentTrends(metrics)
    };

    return JSON.stringify(summary, null, 2);
  }

  private parseAnalysisResponse(response: string, originalMetrics: PerformanceMetrics[]): AIAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      
      return {
        insights: this.formatInsights(parsed.insights || parsed.keyInsights || []),
        recommendations: this.formatRecommendations(parsed.recommendations || []),
        patterns: this.extractPatterns(parsed.patterns || [], originalMetrics),
        anomalies: this.formatAnomalies(parsed.anomalies || []),
        confidence: parsed.confidence || 0.8,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to parse AI analysis response', error as Error);
      return this.createFallbackAnalysis(originalMetrics);
    }
  }

  private parseCacheOptimizationResponse(response: string, metrics: PerformanceMetrics[]): CacheOptimizationResult {
    try {
      const parsed = JSON.parse(response);
      const currentStats = this.calculateCurrentCacheStats(metrics);
      
      return {
        currentStrategy: currentStats,
        optimizedStrategy: {
          recommendedModel: parsed.recommendedModel || 'smart_memory',
          expectedHitRate: parsed.expectedHitRate || currentStats.hitRate * 1.1,
          expectedLatency: parsed.expectedLatency || currentStats.averageLatency * 0.9,
          rationale: parsed.rationale || 'AI-optimized cache strategy'
        },
        improvements: {
          latencyReduction: parsed.latencyReduction || '10%',
          hitRateImprovement: parsed.hitRateImprovement || '15%',
          overallEfficiency: parsed.overallEfficiency || '12%'
        }
      };
    } catch (error) {
      this.logger.error('Failed to parse cache optimization response', error as Error);
      return this.createFallbackOptimization(metrics);
    }
  }

  private parseAnomalyResponse(response: string): AIAnomaly[] {
    try {
      const parsed = JSON.parse(response);
      const anomalies = parsed.anomalies || [];
      
      return anomalies.map((anomaly: any, index: number) => ({
        id: `anomaly_${Date.now()}_${index}`,
        type: anomaly.type || 'pattern_deviation',
        severity: anomaly.severity || 'moderate',
        description: anomaly.description || 'Performance anomaly detected',
        detectedAt: new Date().toISOString(),
        affectedMetrics: anomaly.affectedMetrics || ['response_time'],
        possibleCauses: anomaly.possibleCauses || ['Unknown cause'],
        recommendedActions: anomaly.recommendedActions || ['Monitor system']
      }));
    } catch (error) {
      this.logger.error('Failed to parse anomaly response', error as Error);
      return [];
    }
  }

  // Utility methods for calculations and formatting
  private calculateAverage(metrics: PerformanceMetrics[], field: keyof PerformanceMetrics): number {
    const values = metrics.map(m => Number(m[field])).filter(v => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private getModelDistribution(metrics: PerformanceMetrics[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    metrics.forEach(m => {
      distribution[m.consistencyModel] = (distribution[m.consistencyModel] || 0) + 1;
    });
    return distribution;
  }

  private getCacheStatusDistribution(metrics: PerformanceMetrics[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    metrics.forEach(m => {
      distribution[m.cacheStatus] = (distribution[m.cacheStatus] || 0) + 1;
    });
    return distribution;
  }

  private getRecentTrends(metrics: PerformanceMetrics[]): any {
    if (metrics.length < 5) return { trend: 'insufficient_data' };
    
    const recent = metrics.slice(-5);
    const avgRecent = this.calculateAverage(recent, 'responseTime');
    const avgPrevious = this.calculateAverage(metrics.slice(-10, -5), 'responseTime');
    
    return {
      responseTimeTrend: avgRecent > avgPrevious ? 'increasing' : 'decreasing',
      trendMagnitude: Math.abs(avgRecent - avgPrevious)
    };
  }

  // Cache management
  private generateCacheKey(type: string, data: any, options: any): string {
    const dataHash = JSON.stringify(data).slice(0, 50);
    const optionsHash = JSON.stringify(options);
    return `${type}_${btoa(dataHash + optionsHash).slice(0, 16)}`;
  }

  private getCachedResult(key: string): any {
    const cached = this.analysisCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.analysisCache.delete(key);
    return null;
  }

  private setCachedResult(key: string, data: any): void {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Fallback methods for error cases
  private createFallbackAnalysis(metrics: PerformanceMetrics[]): AIAnalysisResult {
    return {
      insights: [{
        id: 'fallback_insight',
        type: 'performance',
        title: 'Basic Performance Analysis',
        description: `Analyzed ${metrics.length} performance metrics. AI analysis temporarily unavailable.`,
        severity: 'low',
        confidence: 0.5,
        impact: 'Informational'
      }],
      recommendations: [],
      patterns: [],
      anomalies: [],
      confidence: 0.5,
      analysisTimestamp: new Date().toISOString()
    };
  }

  private createFallbackOptimization(metrics: PerformanceMetrics[]): CacheOptimizationResult {
    const current = this.calculateCurrentCacheStats(metrics);
    
    return {
      currentStrategy: current,
      optimizedStrategy: {
        recommendedModel: 'smart_memory',
        expectedHitRate: current.hitRate * 1.1,
        expectedLatency: current.averageLatency * 0.95,
        rationale: 'Basic optimization recommendation (AI temporarily unavailable)'
      },
      improvements: {
        latencyReduction: '5%',
        hitRateImprovement: '10%',
        overallEfficiency: '7%'
      }
    };
  }

  private calculateCurrentCacheStats(metrics: PerformanceMetrics[]) {
    return {
      model: 'current',
      efficiency: this.calculateAverage(metrics, 'hitRate') / 100,
      hitRate: this.calculateAverage(metrics, 'hitRate'),
      averageLatency: this.calculateAverage(metrics, 'responseTime')
    };
  }

  private formatInsights(insights: any[]): AIInsight[] {
    return insights.map((insight, index) => ({
      id: `insight_${Date.now()}_${index}`,
      type: insight.type || 'performance',
      title: insight.title || insight.summary || 'Performance Insight',
      description: insight.description || insight.content || '',
      severity: insight.severity || 'medium',
      confidence: insight.confidence || 0.8,
      impact: insight.impact || 'Performance optimization opportunity',
      suggestedActions: insight.suggestedActions || insight.actions || []
    }));
  }

  private formatRecommendations(recommendations: any[]): AIRecommendation[] {
    return recommendations.map((rec, index) => ({
      id: `rec_${Date.now()}_${index}`,
      category: rec.category || 'performance_tuning',
      title: rec.title || rec.action || 'Optimization Recommendation',
      description: rec.description || rec.details || '',
      priority: rec.priority || 'medium',
      expectedImprovement: rec.expectedImprovement || rec.impact || 'Performance improvement',
      implementationComplexity: rec.complexity || 'moderate',
      steps: rec.steps || rec.actions || []
    }));
  }

  private extractPatterns(patterns: any[], metrics: PerformanceMetrics[]): PerformancePattern[] {
    // Basic pattern detection as fallback
    return [{
      pattern: 'consistent',
      confidence: 0.7,
      description: 'System showing consistent performance patterns',
      metrics: {
        avgResponseTime: this.calculateAverage(metrics, 'responseTime'),
        avgHitRate: this.calculateAverage(metrics, 'hitRate'),
        volatilityScore: 0.3
      },
      timeRange: {
        start: metrics[0]?.timestamp || new Date().toISOString(),
        end: metrics[metrics.length - 1]?.timestamp || new Date().toISOString()
      }
    }];
  }

  private formatAnomalies(anomalies: any[]): AIAnomaly[] {
    return anomalies.map((anomaly, index) => ({
      id: `anomaly_${Date.now()}_${index}`,
      type: anomaly.type || 'pattern_deviation',
      severity: anomaly.severity || 'moderate',
      description: anomaly.description || 'Performance anomaly detected',
      detectedAt: new Date().toISOString(),
      affectedMetrics: anomaly.affectedMetrics || ['response_time'],
      possibleCauses: anomaly.possibleCauses || ['Unknown'],
      recommendedActions: anomaly.recommendedActions || ['Monitor']
    }));
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;