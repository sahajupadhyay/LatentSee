import { createLogger } from '@/lib/logger';

/**
 * AI Usage Tracker
 * 
 * Tracks OpenAI API usage, costs, and provides budget monitoring
 * to ensure we stay within the $5 budget limit.
 */

export interface AIUsageEntry {
  id: string;
  timestamp: Date;
  operation: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: {
    prompt: number;
    completion: number;
    total: number;
  };
  success: boolean;
  error?: string;
}

export interface UsageSummary {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageCostPerRequest: number;
  averageTokensPerRequest: number;
  budgetRemaining: number;
  budgetUtilization: number;
  periodCovered: {
    start: Date;
    end: Date;
  };
  topOperations: Array<{
    operation: string;
    count: number;
    totalCost: number;
    percentage: number;
  }>;
  costByModel: Record<string, {
    requests: number;
    totalCost: number;
    totalTokens: number;
  }>;
}

export class AIUsageTracker {
  private logger = createLogger('ai-usage-tracker');
  private usageHistory: AIUsageEntry[] = [];
  private readonly BUDGET_LIMIT: number = 5.00; // $5 budget
  private readonly MAX_HISTORY_SIZE: number = 1000;
  
  // OpenAI pricing (as of 2024)
  private readonly PRICING = {
    'gpt-4o-mini': {
      prompt: 0.000150 / 1000,    // $0.150 per 1k tokens
      completion: 0.000600 / 1000  // $0.600 per 1k tokens
    },
    'gpt-4o': {
      prompt: 0.0025 / 1000,      // $2.50 per 1k tokens
      completion: 0.010 / 1000    // $10.00 per 1k tokens
    },
    'gpt-3.5-turbo': {
      prompt: 0.0005 / 1000,      // $0.50 per 1k tokens
      completion: 0.0015 / 1000   // $1.50 per 1k tokens
    }
  };

  constructor() {
    this.logger.info('AI Usage Tracker initialized', {
      budgetLimit: this.BUDGET_LIMIT,
      supportedModels: Object.keys(this.PRICING)
    });
    
    // Load existing usage from localStorage if available
    this.loadUsageHistory();
  }

  /**
   * Track a new AI operation
   */
  trackUsage(
    operation: string,
    model: string,
    tokens: { prompt: number; completion: number },
    success: boolean,
    error?: string
  ): AIUsageEntry {
    const cost = this.calculateCost(model, tokens);
    
    const entry: AIUsageEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      operation,
      model,
      tokens: {
        prompt: tokens.prompt,
        completion: tokens.completion,
        total: tokens.prompt + tokens.completion
      },
      cost,
      success,
      error
    };

    this.usageHistory.push(entry);
    
    // Maintain history size
    if (this.usageHistory.length > this.MAX_HISTORY_SIZE) {
      this.usageHistory = this.usageHistory.slice(-this.MAX_HISTORY_SIZE);
    }

    // Save to persistent storage
    this.saveUsageHistory();

    // Log the usage
    this.logger.info('AI usage tracked', {
      operation,
      model,
      totalTokens: entry.tokens.total,
      totalCost: entry.cost.total,
      success,
      budgetRemaining: this.getBudgetRemaining()
    });

    // Check budget warnings
    this.checkBudgetWarnings();

    return entry;
  }

  /**
   * Get current usage summary
   */
  getUsageSummary(timeframe?: {
    start?: Date;
    end?: Date;
  }): UsageSummary {
    let filteredHistory = this.usageHistory;
    
    if (timeframe) {
      filteredHistory = this.usageHistory.filter(entry => {
        const entryTime = entry.timestamp;
        if (timeframe.start && entryTime < timeframe.start) return false;
        if (timeframe.end && entryTime > timeframe.end) return false;
        return true;
      });
    }

    if (filteredHistory.length === 0) {
      return this.getEmptySummary();
    }

    const totalCost = filteredHistory.reduce((sum, entry) => sum + entry.cost.total, 0);
    const totalTokens = filteredHistory.reduce((sum, entry) => sum + entry.tokens.total, 0);
    const totalRequests = filteredHistory.length;
    const successfulRequests = filteredHistory.filter(entry => entry.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const topOperations = this.getTopOperations(filteredHistory);
    const costByModel = this.getCostByModel(filteredHistory);

    const periodStart = filteredHistory.reduce(
      (earliest, entry) => entry.timestamp < earliest ? entry.timestamp : earliest,
      filteredHistory[0].timestamp
    );
    
    const periodEnd = filteredHistory.reduce(
      (latest, entry) => entry.timestamp > latest ? entry.timestamp : latest,
      filteredHistory[0].timestamp
    );

    return {
      totalCost,
      totalTokens,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      averageTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
      budgetRemaining: this.getBudgetRemaining(),
      budgetUtilization: (totalCost / this.BUDGET_LIMIT) * 100,
      periodCovered: {
        start: periodStart,
        end: periodEnd
      },
      topOperations,
      costByModel
    };
  }

  /**
   * Check if we can afford an operation
   */
  canAffordOperation(
    model: string,
    estimatedTokens: { prompt: number; completion: number }
  ): {
    canAfford: boolean;
    estimatedCost: number;
    budgetRemaining: number;
    costBreakdown: {
      prompt: number;
      completion: number;
      total: number;
    };
  } {
    const costBreakdown = this.calculateCost(model, estimatedTokens);
    const budgetRemaining = this.getBudgetRemaining();
    const canAfford = costBreakdown.total <= budgetRemaining;

    return {
      canAfford,
      estimatedCost: costBreakdown.total,
      budgetRemaining,
      costBreakdown
    };
  }

  /**
   * Get budget status
   */
  getBudgetStatus(): {
    limit: number;
    used: number;
    remaining: number;
    utilizationPercentage: number;
    status: 'safe' | 'warning' | 'critical' | 'exceeded';
    message: string;
  } {
    const used = this.getTotalCost();
    const remaining = this.getBudgetRemaining();
    const utilizationPercentage = (used / this.BUDGET_LIMIT) * 100;

    let status: 'safe' | 'warning' | 'critical' | 'exceeded' = 'safe';
    let message = 'Budget usage is within safe limits';

    if (utilizationPercentage >= 100) {
      status = 'exceeded';
      message = 'Budget limit exceeded! No more AI operations should be performed.';
    } else if (utilizationPercentage >= 90) {
      status = 'critical';
      message = 'Budget critically low. Consider limiting AI operations.';
    } else if (utilizationPercentage >= 75) {
      status = 'warning';
      message = 'Budget usage approaching limit. Monitor usage carefully.';
    }

    return {
      limit: this.BUDGET_LIMIT,
      used,
      remaining,
      utilizationPercentage,
      status,
      message
    };
  }

  /**
   * Get cost projection for planned operations
   */
  projectCosts(
    plannedOperations: Array<{
      operation: string;
      model: string;
      estimatedTokens: { prompt: number; completion: number };
    }>
  ): {
    totalProjectedCost: number;
    projectedBudgetUtilization: number;
    canAffordAll: boolean;
    operationBreakdown: Array<{
      operation: string;
      estimatedCost: number;
      affordable: boolean;
    }>;
    recommendations: string[];
  } {
    const currentUsed = this.getTotalCost();
    let totalProjectedCost = 0;
    const operationBreakdown: Array<{
      operation: string;
      estimatedCost: number;
      affordable: boolean;
    }> = [];

    let runningCost = currentUsed;
    
    for (const op of plannedOperations) {
      const cost = this.calculateCost(op.model, op.estimatedTokens);
      const costTotal = cost.total;
      totalProjectedCost += costTotal;
      
      const affordable = (runningCost + costTotal) <= this.BUDGET_LIMIT;
      runningCost += costTotal;
      
      operationBreakdown.push({
        operation: op.operation,
        estimatedCost: costTotal,
        affordable
      });
    }

    const projectedBudgetUtilization = ((currentUsed + totalProjectedCost) / this.BUDGET_LIMIT) * 100;
    const canAffordAll = projectedBudgetUtilization <= 100;

    const recommendations = this.generateCostRecommendations(
      projectedBudgetUtilization,
      operationBreakdown
    );

    return {
      totalProjectedCost,
      projectedBudgetUtilization,
      canAffordAll,
      operationBreakdown,
      recommendations
    };
  }

  /**
   * Private helper methods
   */
  private calculateCost(
    model: string,
    tokens: { prompt: number; completion: number }
  ): { prompt: number; completion: number; total: number } {
    const pricing = this.PRICING[model as keyof typeof this.PRICING];
    
    if (!pricing) {
      this.logger.warn('Unknown model pricing, using gpt-4o-mini rates', { model });
      const fallbackPricing = this.PRICING['gpt-4o-mini'];
      return {
        prompt: tokens.prompt * fallbackPricing.prompt,
        completion: tokens.completion * fallbackPricing.completion,
        total: (tokens.prompt * fallbackPricing.prompt) + (tokens.completion * fallbackPricing.completion)
      };
    }

    const promptCost = tokens.prompt * pricing.prompt;
    const completionCost = tokens.completion * pricing.completion;
    
    return {
      prompt: promptCost,
      completion: completionCost,
      total: promptCost + completionCost
    };
  }

  private getTotalCost(): number {
    return this.usageHistory.reduce((sum, entry) => sum + entry.cost.total, 0);
  }

  getBudgetRemaining(): number {
    return Math.max(0, this.BUDGET_LIMIT - this.getTotalCost());
  }

  private getTopOperations(history: AIUsageEntry[]): Array<{
    operation: string;
    count: number;
    totalCost: number;
    percentage: number;
  }> {
    const operationStats: Record<string, { count: number; totalCost: number }> = {};
    
    history.forEach(entry => {
      if (!operationStats[entry.operation]) {
        operationStats[entry.operation] = { count: 0, totalCost: 0 };
      }
      operationStats[entry.operation].count++;
      operationStats[entry.operation].totalCost += entry.cost.total;
    });

    const totalCost = history.reduce((sum, entry) => sum + entry.cost.total, 0);

    return Object.entries(operationStats)
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        totalCost: stats.totalCost,
        percentage: totalCost > 0 ? (stats.totalCost / totalCost) * 100 : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);
  }

  private getCostByModel(history: AIUsageEntry[]): Record<string, {
    requests: number;
    totalCost: number;
    totalTokens: number;
  }> {
    const modelStats: Record<string, {
      requests: number;
      totalCost: number;
      totalTokens: number;
    }> = {};

    history.forEach(entry => {
      if (!modelStats[entry.model]) {
        modelStats[entry.model] = { requests: 0, totalCost: 0, totalTokens: 0 };
      }
      modelStats[entry.model].requests++;
      modelStats[entry.model].totalCost += entry.cost.total;
      modelStats[entry.model].totalTokens += entry.tokens.total;
    });

    return modelStats;
  }

  private getEmptySummary(): UsageSummary {
    return {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageCostPerRequest: 0,
      averageTokensPerRequest: 0,
      budgetRemaining: this.BUDGET_LIMIT,
      budgetUtilization: 0,
      periodCovered: {
        start: new Date(),
        end: new Date()
      },
      topOperations: [],
      costByModel: {}
    };
  }

  private generateCostRecommendations(
    projectedUtilization: number,
    operationBreakdown: Array<{ operation: string; estimatedCost: number; affordable: boolean }>
  ): string[] {
    const recommendations: string[] = [];

    if (projectedUtilization > 100) {
      recommendations.push('Projected usage exceeds budget - consider reducing scope');
      recommendations.push('Prioritize most critical AI operations only');
    } else if (projectedUtilization > 90) {
      recommendations.push('Projected usage is very high - monitor costs carefully');
      recommendations.push('Consider using more cost-effective models where possible');
    } else if (projectedUtilization > 75) {
      recommendations.push('Projected usage approaching budget limit');
      recommendations.push('Plan remaining operations carefully');
    }

    const unaffordableOps = operationBreakdown.filter(op => !op.affordable);
    if (unaffordableOps.length > 0) {
      recommendations.push(`${unaffordableOps.length} operations may exceed budget`);
      recommendations.push('Consider alternative approaches or reduced scope');
    }

    return recommendations;
  }

  private checkBudgetWarnings(): void {
    const status = this.getBudgetStatus();
    
    if (status.status === 'exceeded') {
      this.logger.error('AI budget exceeded!', new Error(`Budget exceeded: $${status.used.toFixed(4)} / $${status.limit}`));
    } else if (status.status === 'critical') {
      this.logger.warn('AI budget critically low', {
        remaining: status.remaining,
        utilization: status.utilizationPercentage
      });
    } else if (status.status === 'warning') {
      this.logger.warn('AI budget approaching limit', {
        utilization: status.utilizationPercentage
      });
    }
  }

  private generateId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUsageHistory(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ai_usage_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.usageHistory = parsed.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
          this.logger.info('Loaded usage history', { 
            entries: this.usageHistory.length,
            totalCost: this.getTotalCost()
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to load usage history', error as Error);
    }
  }

  private saveUsageHistory(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_usage_history', JSON.stringify(this.usageHistory));
      }
    } catch (error) {
      this.logger.error('Failed to save usage history', error as Error);
    }
  }

  /**
   * Reset usage history (for testing or new budget periods)
   */
  resetUsage(): void {
    this.usageHistory = [];
    this.saveUsageHistory();
    this.logger.info('Usage history reset');
  }

  /**
   * Export usage data
   */
  exportUsageData(): {
    summary: UsageSummary;
    detailedHistory: AIUsageEntry[];
    budgetStatus: {
      limit: number;
      used: number;
      remaining: number;
      utilizationPercentage: number;
      status: 'safe' | 'warning' | 'critical' | 'exceeded';
      message: string;
    };
  } {
    return {
      summary: this.getUsageSummary(),
      detailedHistory: [...this.usageHistory],
      budgetStatus: this.getBudgetStatus()
    };
  }
}

// Export singleton instance
export const aiUsageTracker = new AIUsageTracker();
export default aiUsageTracker;