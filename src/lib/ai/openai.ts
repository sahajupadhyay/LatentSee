import OpenAI from 'openai';
import { createLogger } from '@/lib/logger';
import { AIServiceConfig, AIServiceError } from './types';

/**
 * OpenAI Client Configuration
 * 
 * Handles OpenAI API interactions with cost optimization,
 * error handling, and token management for LatentSee's
 * AI-powered features.
 */

class OpenAIClient {
  private client: OpenAI | null = null;
  private config: AIServiceConfig;
  private logger = createLogger('openai-client');
  private requestCount = 0;
  private tokenUsage = 0;

  constructor() {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini', // Cost-effective model
      maxTokens: 500, // Conservative token limit
      temperature: 0.3, // Lower temperature for consistent analysis
      enableCaching: true,
      analysisFrequency: 'on-demand'
    };

    this.initializeClient();
  }

  private initializeClient(): void {
    if (!this.config.openaiApiKey) {
      this.logger.warn('OpenAI API key not configured. AI features will be disabled.');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: this.config.openaiApiKey,
      });
      this.logger.info('OpenAI client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client', error as Error);
    }
  }

  /**
   * Check if AI services are available
   */
  isAvailable(): boolean {
    return this.client !== null && !!this.config.openaiApiKey;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): { requests: number; tokens: number; estimatedCost: number } {
    // Rough cost estimation: gpt-4o-mini is ~$0.15/1K input tokens, $0.60/1K output tokens
    const estimatedCost = (this.tokenUsage / 1000) * 0.375; // Average of input/output
    return {
      requests: this.requestCount,
      tokens: this.tokenUsage,
      estimatedCost: Math.round(estimatedCost * 100) / 100
    };
  }

  /**
   * Create a completion with error handling and cost optimization
   */
  async createCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      maxTokens?: number;
      temperature?: number;
      responseFormat?: 'text' | 'json';
    } = {}
  ): Promise<{ content: string; usage: { tokens: number; cost: number } } | null> {
    if (!this.isAvailable()) {
      this.logger.warn('OpenAI client not available');
      return null;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.logger.info('Creating OpenAI completion', { requestId, messageCount: messages.length });

    try {
      this.requestCount++;

      const completion = await this.client!.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature || this.config.temperature,
        response_format: options.responseFormat === 'json' 
          ? { type: 'json_object' } 
          : { type: 'text' }
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;
      const cost = (tokensUsed / 1000) * 0.375; // Rough cost estimation

      this.tokenUsage += tokensUsed;

      this.logger.info('OpenAI completion successful', {
        requestId,
        tokensUsed,
        estimatedCost: cost,
        contentLength: content.length
      });

      return {
        content,
        usage: {
          tokens: tokensUsed,
          cost: Math.round(cost * 1000) / 1000
        }
      };

    } catch (error: any) {
      this.logger.error('OpenAI completion failed', error, { requestId });
      
      // Handle specific error types
      if (error.error?.type === 'insufficient_quota') {
        throw this.createServiceError('RATE_LIMIT', 'OpenAI quota exceeded', error);
      } else if (error.status === 429) {
        throw this.createServiceError('RATE_LIMIT', 'Rate limit exceeded', error);
      } else if (error.status >= 400 && error.status < 500) {
        throw this.createServiceError('INVALID_REQUEST', 'Invalid request to OpenAI', error);
      } else {
        throw this.createServiceError('API_ERROR', 'OpenAI API error', error);
      }
    }
  }

  /**
   * Analyze performance data with cost-optimized prompting
   */
  async analyzePerformance(
    metricsData: string,
    analysisType: 'quick' | 'detailed' = 'quick'
  ): Promise<{ content: string; usage: { tokens: number; cost: number } } | null> {
    const systemPrompt = this.getPerformanceAnalysisPrompt(analysisType);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Analyze this performance data:\n\n${metricsData}` }
    ];

    return this.createCompletion(messages, {
      maxTokens: analysisType === 'quick' ? 300 : 600,
      temperature: 0.2,
      responseFormat: 'json'
    });
  }

  /**
   * Get cache optimization recommendations
   */
  async optimizeCache(
    currentMetrics: string,
    context: string = ''
  ): Promise<{ content: string; usage: { tokens: number; cost: number } } | null> {
    const systemPrompt = `You are an AI performance optimization expert specializing in distributed caching systems. 
    Analyze the provided metrics and provide specific, actionable cache optimization recommendations.
    
    Focus on:
    - Cache hit rate improvements
    - Latency reduction strategies
    - Optimal consistency model selection (neural_authority, neural_cache, smart_memory)
    - Configuration optimizations
    
    Respond in JSON format with: recommendations, expectedImprovements, and rationale.
    Be concise and practical.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Current metrics: ${currentMetrics}\nContext: ${context}` }
    ];

    return this.createCompletion(messages, {
      maxTokens: 400,
      temperature: 0.1,
      responseFormat: 'json'
    });
  }

  /**
   * Detect performance anomalies
   */
  async detectAnomalies(
    historicalData: string,
    currentData: string
  ): Promise<{ content: string; usage: { tokens: number; cost: number } } | null> {
    const systemPrompt = `You are an AI anomaly detection system for distributed cloud applications.
    Compare historical performance data with current metrics to identify anomalies.
    
    Look for:
    - Unusual latency patterns
    - Cache performance degradation
    - Error rate increases
    - Consistency model performance deviations
    
    Respond in JSON format with: anomalies (array), severity, and recommendations.
    Only report significant anomalies worth attention.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Historical: ${historicalData}\nCurrent: ${currentData}` }
    ];

    return this.createCompletion(messages, {
      maxTokens: 350,
      temperature: 0.1,
      responseFormat: 'json'
    });
  }

  private getPerformanceAnalysisPrompt(type: 'quick' | 'detailed'): string {
    const basePrompt = `You are an AI performance analyst for distributed cloud systems specializing in consistency-latency trade-offs.
    Analyze the provided performance metrics and provide insights about:
    - Performance patterns and trends
    - Cache efficiency analysis
    - Consistency model effectiveness
    - Optimization opportunities`;

    if (type === 'quick') {
      return `${basePrompt}
      
      Provide a concise analysis in JSON format with:
      - summary: brief overview
      - keyInsights: top 2-3 insights
      - recommendations: top 2 action items
      
      Keep response under 200 words total.`;
    } else {
      return `${basePrompt}
      
      Provide detailed analysis in JSON format with:
      - summary: comprehensive overview
      - patterns: identified performance patterns
      - insights: detailed findings with confidence scores
      - recommendations: prioritized action items
      - anomalies: any unusual patterns detected
      
      Be thorough but concise.`;
    }
  }

  private createServiceError(
    code: AIServiceError['code'], 
    message: string, 
    originalError?: any
  ): AIServiceError {
    return {
      code,
      message,
      details: originalError,
      retryable: code === 'RATE_LIMIT' || code === 'NETWORK_ERROR'
    };
  }

  /**
   * Reset usage statistics (for testing/monitoring)
   */
  resetUsageStats(): void {
    this.requestCount = 0;
    this.tokenUsage = 0;
    this.logger.info('Usage statistics reset');
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();
export default openaiClient;