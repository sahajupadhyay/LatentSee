import { aiService } from './index';
import { createLogger } from '@/lib/logger';
import type {
  PerformanceMetrics,
  AIAnalysisResult,
  AIInsight,
  PerformancePattern,
  AIAnomaly
} from './types';

/**
 * AI-Powered Performance Analyzer
 * 
 * Analyzes performance metrics using AI to detect patterns,
 * identify bottlenecks, and provide intelligent insights
 * about system behavior and optimization opportunities.
 */

export class PerformanceAnalyzer {
  private logger = createLogger('performance-analyzer');
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly MIN_ANALYSIS_THRESHOLD = 5;

  constructor() {
    this.logger.info('Performance Analyzer initialized with AI capabilities');
  }

  /**
   * Add new performance metrics for ongoing analysis
   */
  addMetrics(metrics: PerformanceMetrics | PerformanceMetrics[]): void {
    const newMetrics = Array.isArray(metrics) ? metrics : [metrics];
    
    this.metricsHistory.push(...newMetrics);
    
    // Maintain history size limit
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY_SIZE);
    }
    
    this.logger.debug('Added metrics to analyzer', { 
      newCount: newMetrics.length, 
      totalHistory: this.metricsHistory.length 
    });
  }

  /**
   * Get comprehensive AI-powered performance analysis
   */
  async getComprehensiveAnalysis(
    options: {
      timeRange?: { start: string; end: string };
      analysisDepth?: 'quick' | 'detailed';
      includeRecommendations?: boolean;
    } = {}
  ): Promise<AIAnalysisResult | null> {
    const { 
      timeRange, 
      analysisDepth = 'quick', 
      includeRecommendations = true 
    } = options;

    if (!aiService.isAvailable()) {
      this.logger.warn('AI service not available for analysis');
      return this.getFallbackAnalysis();
    }

    const analysisMetrics = this.getFilteredMetrics(timeRange);
    
    if (analysisMetrics.length < this.MIN_ANALYSIS_THRESHOLD) {
      this.logger.warn('Insufficient metrics for AI analysis', { 
        available: analysisMetrics.length, 
        required: this.MIN_ANALYSIS_THRESHOLD 
      });
      return this.getFallbackAnalysis(analysisMetrics);
    }

    this.logger.info('Starting comprehensive AI performance analysis', {
      metricsCount: analysisMetrics.length,
      analysisDepth,
      timeRange
    });

    try {
      const analysis = await aiService.analyzePerformance(analysisMetrics, {
        analysisType: analysisDepth,
        includePatterns: true,
        includeAnomalies: true
      });

      if (analysis) {
        // Enhance analysis with local computations
        analysis.patterns = [...analysis.patterns, ...this.detectLocalPatterns(analysisMetrics)];
        
        this.logger.info('AI analysis completed successfully', {
          insightsCount: analysis.insights.length,
          recommendationsCount: analysis.recommendations.length,
          patternsCount: analysis.patterns.length
        });
      }

      return analysis;

    } catch (error) {
      this.logger.error('AI analysis failed, falling back to basic analysis', error as Error);
      return this.getFallbackAnalysis(analysisMetrics);
    }
  }

  /**
   * Get real-time performance insights for current metrics
   */
  async getQuickInsights(
    recentCount: number = 10
  ): Promise<AIInsight[]> {
    if (this.metricsHistory.length === 0) {
      return [];
    }

    const recentMetrics = this.metricsHistory.slice(-recentCount);
    
    if (!aiService.isAvailable()) {
      return this.getBasicInsights(recentMetrics);
    }

    try {
      const insights = await aiService.getQuickInsights(recentMetrics);
      
      // Add local insights
      const localInsights = this.getBasicInsights(recentMetrics);
      
      return [...insights, ...localInsights];

    } catch (error) {
      this.logger.error('Quick insights failed', error as Error);
      return this.getBasicInsights(recentMetrics);
    }
  }

  /**
   * Detect performance anomalies using AI
   */
  async detectAnomalies(
    lookbackMinutes: number = 30,
    currentWindow: number = 5
  ): Promise<AIAnomaly[]> {
    if (this.metricsHistory.length < 10) {
      return [];
    }

    const now = new Date();
    const lookbackTime = new Date(now.getTime() - lookbackMinutes * 60 * 1000);
    const currentTime = new Date(now.getTime() - currentWindow * 60 * 1000);

    const historicalMetrics = this.metricsHistory.filter(m => {
      const metricTime = new Date(m.timestamp);
      return metricTime >= lookbackTime && metricTime <= currentTime;
    });

    const currentMetrics = this.metricsHistory.filter(m => {
      const metricTime = new Date(m.timestamp);
      return metricTime > currentTime;
    });

    if (historicalMetrics.length < 5 || currentMetrics.length === 0) {
      return [];
    }

    if (!aiService.isAvailable()) {
      return this.detectBasicAnomalies(historicalMetrics, currentMetrics);
    }

    try {
      const aiAnomalies = await aiService.detectAnomalies(historicalMetrics, currentMetrics);
      const basicAnomalies = this.detectBasicAnomalies(historicalMetrics, currentMetrics);
      
      return [...aiAnomalies, ...basicAnomalies];

    } catch (error) {
      this.logger.error('AI anomaly detection failed', error as Error);
      return this.detectBasicAnomalies(historicalMetrics, currentMetrics);
    }
  }

  /**
   * Get performance trends and patterns
   */
  getPerformanceTrends(
    timeRange?: { start: string; end: string }
  ): {
    responseTimeTrend: 'improving' | 'degrading' | 'stable';
    hitRateTrend: 'improving' | 'degrading' | 'stable';
    consistencyModelPerformance: Record<string, number>;
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const metrics = this.getFilteredMetrics(timeRange);
    
    if (metrics.length === 0) {
      return {
        responseTimeTrend: 'stable',
        hitRateTrend: 'stable',
        consistencyModelPerformance: {},
        overallHealth: 'fair'
      };
    }

    // Calculate trends
    const responseTimeTrend = this.calculateTrend(metrics, 'responseTime');
    const hitRateTrend = this.calculateTrend(metrics, 'hitRate');
    
    // Model performance comparison
    const modelPerformance = this.calculateModelPerformance(metrics);
    
    // Overall health score
    const overallHealth = this.calculateOverallHealth(metrics);

    return {
      responseTimeTrend: responseTimeTrend > 0 ? 'degrading' : responseTimeTrend < 0 ? 'improving' : 'stable',
      hitRateTrend: hitRateTrend > 0 ? 'improving' : hitRateTrend < 0 ? 'degrading' : 'stable',
      consistencyModelPerformance: modelPerformance,
      overallHealth
    };
  }

  /**
   * Get current system health metrics
   */
  getCurrentHealth(): {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor';
    criticalIssues: string[];
    recommendations: string[];
  } {
    if (this.metricsHistory.length === 0) {
      return {
        score: 50,
        status: 'fair',
        criticalIssues: ['No performance data available'],
        recommendations: ['Start testing to collect performance metrics']
      };
    }

    const recentMetrics = this.metricsHistory.slice(-20);
    const avgResponseTime = this.calculateAverage(recentMetrics, 'responseTime');
    const avgHitRate = this.calculateAverage(recentMetrics, 'hitRate');
    const errorRate = this.calculateErrorRate(recentMetrics);

    // Calculate health score (0-100)
    let score = 100;
    
    // Response time penalties
    if (avgResponseTime > 1000) score -= 30;
    else if (avgResponseTime > 500) score -= 15;
    else if (avgResponseTime > 200) score -= 5;
    
    // Hit rate bonuses/penalties
    if (avgHitRate > 80) score += 10;
    else if (avgHitRate < 50) score -= 20;
    else if (avgHitRate < 30) score -= 40;
    
    // Error rate penalties
    if (errorRate > 0.1) score -= 50;
    else if (errorRate > 0.05) score -= 25;
    else if (errorRate > 0.01) score -= 10;

    score = Math.max(0, Math.min(100, score));

    const status = score >= 85 ? 'excellent' : 
                   score >= 70 ? 'good' : 
                   score >= 50 ? 'fair' : 'poor';

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    if (avgResponseTime > 1000) {
      criticalIssues.push('High response times detected');
      recommendations.push('Consider optimizing cache strategies');
    }
    
    if (avgHitRate < 30) {
      criticalIssues.push('Very low cache hit rate');
      recommendations.push('Review cache configuration and TTL settings');
    }
    
    if (errorRate > 0.05) {
      criticalIssues.push('Elevated error rate');
      recommendations.push('Investigate system errors and stability');
    }

    return { score, status, criticalIssues, recommendations };
  }

  /**
   * Private helper methods
   */
  private getFilteredMetrics(timeRange?: { start: string; end: string }): PerformanceMetrics[] {
    if (!timeRange) {
      return [...this.metricsHistory];
    }

    const startTime = new Date(timeRange.start);
    const endTime = new Date(timeRange.end);

    return this.metricsHistory.filter(m => {
      const metricTime = new Date(m.timestamp);
      return metricTime >= startTime && metricTime <= endTime;
    });
  }

  private calculateAverage(metrics: PerformanceMetrics[], field: keyof PerformanceMetrics): number {
    const values = metrics.map(m => Number(m[field])).filter(v => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateErrorRate(metrics: PerformanceMetrics[]): number {
    const errors = metrics.filter(m => m.errorOccurred).length;
    return metrics.length > 0 ? errors / metrics.length : 0;
  }

  private calculateTrend(metrics: PerformanceMetrics[], field: keyof PerformanceMetrics): number {
    if (metrics.length < 4) return 0;

    const half = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, half);
    const secondHalf = metrics.slice(half);

    const firstAvg = this.calculateAverage(firstHalf, field);
    const secondAvg = this.calculateAverage(secondHalf, field);

    return secondAvg - firstAvg;
  }

  private calculateModelPerformance(metrics: PerformanceMetrics[]): Record<string, number> {
    const models = ['neural_authority', 'neural_cache', 'smart_memory'];
    const performance: Record<string, number> = {};

    models.forEach(model => {
      const modelMetrics = metrics.filter(m => m.consistencyModel === model);
      if (modelMetrics.length > 0) {
        const avgResponse = this.calculateAverage(modelMetrics, 'responseTime');
        const avgHitRate = this.calculateAverage(modelMetrics, 'hitRate');
        
        // Simple performance score: lower latency + higher hit rate = better
        performance[model] = Math.max(0, 100 - (avgResponse / 10) + (avgHitRate / 2));
      }
    });

    return performance;
  }

  private calculateOverallHealth(metrics: PerformanceMetrics[]): 'excellent' | 'good' | 'fair' | 'poor' {
    const health = this.getCurrentHealth();
    return health.status;
  }

  private detectLocalPatterns(metrics: PerformanceMetrics[]): PerformancePattern[] {
    // Basic pattern detection without AI
    const patterns: PerformancePattern[] = [];
    
    if (metrics.length < 10) return patterns;

    const responseTimeStdDev = this.calculateStandardDeviation(metrics, 'responseTime');
    const avgResponseTime = this.calculateAverage(metrics, 'responseTime');
    
    const volatilityScore = responseTimeStdDev / avgResponseTime;
    
    let patternType: PerformancePattern['pattern'] = 'consistent';
    if (volatilityScore > 0.5) patternType = 'volatile';
    else if (volatilityScore > 0.3) patternType = 'improving';

    patterns.push({
      pattern: patternType,
      confidence: 0.7,
      description: `Performance showing ${patternType} patterns based on response time analysis`,
      metrics: {
        avgResponseTime,
        avgHitRate: this.calculateAverage(metrics, 'hitRate'),
        volatilityScore
      },
      timeRange: {
        start: metrics[0].timestamp,
        end: metrics[metrics.length - 1].timestamp
      }
    });

    return patterns;
  }

  private calculateStandardDeviation(metrics: PerformanceMetrics[], field: keyof PerformanceMetrics): number {
    const values = metrics.map(m => Number(m[field])).filter(v => !isNaN(v));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  private getFallbackAnalysis(metrics: PerformanceMetrics[] = []): AIAnalysisResult {
    const fallbackInsights = this.getBasicInsights(metrics);
    
    return {
      insights: fallbackInsights,
      recommendations: [
        {
          id: 'fallback_rec_1',
          category: 'performance_tuning',
          title: 'Monitor Performance Trends',
          description: 'Continue monitoring performance metrics to identify optimization opportunities',
          priority: 'medium',
          expectedImprovement: 'Baseline performance tracking',
          implementationComplexity: 'easy',
          steps: ['Continue testing different consistency models', 'Monitor cache hit rates', 'Track response times']
        }
      ],
      patterns: this.detectLocalPatterns(metrics),
      anomalies: [],
      confidence: 0.6,
      analysisTimestamp: new Date().toISOString()
    };
  }

  private getBasicInsights(metrics: PerformanceMetrics[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    if (metrics.length === 0) {
      insights.push({
        id: 'no_data',
        type: 'performance',
        title: 'No Performance Data',
        description: 'Start testing the consistency models to collect performance metrics',
        severity: 'low',
        confidence: 1.0,
        impact: 'Begin collecting data for analysis'
      });
      return insights;
    }

    const avgResponseTime = this.calculateAverage(metrics, 'responseTime');
    const avgHitRate = this.calculateAverage(metrics, 'hitRate');
    
    // Response time insights
    if (avgResponseTime > 1000) {
      insights.push({
        id: 'high_latency',
        type: 'performance',
        title: 'High Response Times Detected',
        description: `Average response time is ${avgResponseTime.toFixed(0)}ms, which may impact user experience`,
        severity: 'high',
        confidence: 0.9,
        impact: 'User experience degradation',
        suggestedActions: ['Consider using neural_cache or smart_memory models', 'Optimize cache TTL settings']
      });
    }
    
    // Cache hit rate insights
    if (avgHitRate < 30) {
      insights.push({
        id: 'low_hit_rate',
        type: 'caching',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate of ${avgHitRate.toFixed(1)}% indicates caching strategy needs optimization`,
        severity: 'medium',
        confidence: 0.8,
        impact: 'Inefficient cache utilization',
        suggestedActions: ['Review cache configuration', 'Adjust TTL values', 'Consider smart_memory model']
      });
    }

    return insights;
  }

  private detectBasicAnomalies(historical: PerformanceMetrics[], current: PerformanceMetrics[]): AIAnomaly[] {
    const anomalies: AIAnomaly[] = [];
    
    const historicalAvgResponse = this.calculateAverage(historical, 'responseTime');
    const currentAvgResponse = this.calculateAverage(current, 'responseTime');
    
    // Detect significant response time increase
    if (currentAvgResponse > historicalAvgResponse * 1.5) {
      anomalies.push({
        id: `anomaly_latency_${Date.now()}`,
        type: 'latency_spike',
        severity: 'moderate',
        description: `Response time increased by ${((currentAvgResponse / historicalAvgResponse - 1) * 100).toFixed(1)}%`,
        detectedAt: new Date().toISOString(),
        affectedMetrics: ['response_time'],
        possibleCauses: ['System load increase', 'Cache performance degradation', 'Network issues'],
        recommendedActions: ['Monitor system resources', 'Check cache configuration', 'Review recent changes']
      });
    }

    return anomalies;
  }

  /**
   * Get metrics history for external use
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metricsHistory = [];
    this.logger.info('Performance metrics history cleared');
  }
}

// Export singleton instance
export const performanceAnalyzer = new PerformanceAnalyzer();
export default performanceAnalyzer;