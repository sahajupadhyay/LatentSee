'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { aiService } from '@/lib/ai';
import type { PerformanceMetrics, AIAnalysisResult, AIInsight, AIRecommendation } from '@/lib/ai/types';

interface AIInsightsProps {
  metrics: PerformanceMetrics[];
  isVisible: boolean;
  onClose?: () => void;
}

interface AIInsightsState {
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  budgetStatus: 'safe' | 'warning' | 'critical' | 'exceeded';
}

// Individual Insight Card Component
const InsightCard = ({ insight, index }: { insight: AIInsight; index: number }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return Icons.Zap;
      case 'caching': return Icons.Database;
      case 'optimization': return Icons.Target;
      case 'anomaly': return Icons.AlertTriangle;
      default: return Icons.Info;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'performance': return 'text-blue-400';
      case 'caching': return 'text-green-400'; 
      case 'optimization': return 'text-purple-400';
      case 'anomaly': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const IconComponent = getInsightIcon(insight.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 hover:border-neutral-600/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-neutral-700/50 ${getInsightColor(insight.type)}`}>
          <IconComponent size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-neutral-200 mb-1 line-clamp-1">
            {insight.title}
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {insight.description}
          </p>
          {insight.confidence && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 bg-neutral-700 rounded-full overflow-hidden flex-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${insight.confidence * 100}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
              <span className="text-xs text-neutral-500">
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation, index }: { recommendation: AIRecommendation; index: number }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'easy': return Icons.CheckCircle;
      case 'moderate': return Icons.Clock; 
      case 'hard': return Icons.AlertCircle;
      default: return Icons.Info;
    }
  };

  const ComplexityIcon = getComplexityIcon(recommendation.implementationComplexity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 hover:border-neutral-600/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-neutral-200 mb-1 line-clamp-1">
            {recommendation.title}
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {recommendation.description}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
          {recommendation.priority}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-neutral-500">
          <ComplexityIcon size={12} />
          <span className="capitalize">{recommendation.implementationComplexity}</span>
        </div>
        {recommendation.expectedImprovement && (
          <div className="text-green-400">
            {recommendation.expectedImprovement}
          </div>
        )}
      </div>

      {recommendation.steps && recommendation.steps.length > 0 && (
        <details className="mt-3 group">
          <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-300 flex items-center gap-1">
            <Icons.ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
            Implementation Steps
          </summary>
          <div className="mt-2 ml-3 space-y-1">
            {recommendation.steps.slice(0, 3).map((step, idx) => (
              <div key={idx} className="text-xs text-neutral-500 flex items-start gap-2">
                <span className="text-neutral-600 mt-0.5">•</span>
                <span>{step}</span>
              </div>
            ))}
            {recommendation.steps.length > 3 && (
              <div className="text-xs text-neutral-600">
                +{recommendation.steps.length - 3} more steps...
              </div>
            )}
          </div>
        </details>
      )}
    </motion.div>
  );
};

// Main AI Insights Component
export const AIInsights = ({ metrics, isVisible, onClose }: AIInsightsProps) => {
  const [state, setState] = useState<AIInsightsState>({
    analysis: null,
    isLoading: false,
    error: null,
    budgetStatus: 'safe'
  });

  // Get AI analysis when metrics change
  useEffect(() => {
    if (metrics.length === 0 || !isVisible) return;

    const getAIAnalysis = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Check budget status first
        const budget = aiService.getBudgetStatus();
        if (budget.status === 'exceeded') {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'AI budget exceeded. Analysis unavailable.',
            budgetStatus: 'exceeded'
          }));
          return;
        }

        // Check if we can afford the operation
        const affordability = aiService.canAffordOperation('gpt-4o-mini', {
          prompt: 300,
          completion: 200
        });

        if (!affordability.canAfford) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Insufficient budget for AI analysis.',
            budgetStatus: budget.status as any
          }));
          return;
        }

        // Get AI analysis
        const analysis = await aiService.analyzePerformance(metrics, {
          analysisType: 'quick',
          includePatterns: true,
          includeAnomalies: true
        });

        if (!analysis) {
          throw new Error('AI analysis failed. Please try again later.');
        }

        setState(prev => ({
          ...prev,
          analysis,
          isLoading: false,
          budgetStatus: budget.status as any
        }));

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Analysis failed',
          isLoading: false
        }));
      }
    };

    getAIAnalysis();
  }, [metrics, isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                <Icons.Brain className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">AI Performance Insights</h3>
                <p className="text-sm text-neutral-400">
                  {metrics.length} performance metrics analyzed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Budget Status */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                state.budgetStatus === 'safe' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                state.budgetStatus === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                state.budgetStatus === 'critical' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                Budget: {state.budgetStatus}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <Icons.X size={16} className="text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {state.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4"
                />
                <p className="text-sm text-neutral-400">Analyzing performance patterns...</p>
              </div>
            ) : state.error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Icons.AlertTriangle className="text-red-400 mb-4" size={48} />
                <p className="text-sm text-red-400 text-center">{state.error}</p>
              </div>
            ) : state.analysis ? (
              <div className="space-y-6">
                {/* Analysis Summary */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-neutral-200">Analysis Summary</h4>
                    <div className="flex items-center gap-2">
                      <Icons.TrendingUp size={14} className="text-blue-400" />
                      <span className="text-xs text-blue-400">
                        {Math.round(state.analysis.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-neutral-100">
                        {state.analysis.insights.length}
                      </div>
                      <div className="text-xs text-neutral-400">Insights</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-neutral-100">
                        {state.analysis.recommendations.length}
                      </div>
                      <div className="text-xs text-neutral-400">Recommendations</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-neutral-100">
                        {state.analysis.patterns.length}
                      </div>
                      <div className="text-xs text-neutral-400">Patterns</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-neutral-100">
                        {state.analysis.anomalies.length}
                      </div>
                      <div className="text-xs text-neutral-400">Anomalies</div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {state.analysis.insights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-200 mb-3 flex items-center gap-2">
                      <Icons.Lightbulb size={16} className="text-yellow-400" />
                      Performance Insights
                    </h4>
                    <div className="grid gap-3">
                      {state.analysis.insights.map((insight, index) => (
                        <InsightCard key={insight.id} insight={insight} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {state.analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-200 mb-3 flex items-center gap-2">
                      <Icons.Target size={16} className="text-green-400" />
                      AI Recommendations
                    </h4>
                    <div className="grid gap-3">
                      {state.analysis.recommendations.map((rec, index) => (
                        <RecommendationCard key={rec.id} recommendation={rec} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Patterns & Anomalies */}
                {(state.analysis.patterns.length > 0 || state.analysis.anomalies.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Patterns */}
                    {state.analysis.patterns.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-200 mb-3 flex items-center gap-2">
                          <Icons.Activity size={16} className="text-purple-400" />
                          Performance Patterns
                        </h4>
                        <div className="space-y-2">
                          {state.analysis.patterns.map((pattern, index) => (
                            <div key={index} className="bg-neutral-800/30 border border-neutral-700/30 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-neutral-200 capitalize">
                                  {pattern.pattern}
                                </span>
                                <span className="text-xs text-neutral-400">
                                  {Math.round(pattern.confidence * 100)}%
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 leading-relaxed">
                                {pattern.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Anomalies */}
                    {state.analysis.anomalies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-200 mb-3 flex items-center gap-2">
                          <Icons.AlertTriangle size={16} className="text-orange-400" />
                          Detected Anomalies
                        </h4>
                        <div className="space-y-2">
                          {state.analysis.anomalies.map((anomaly, index) => (
                            <div key={anomaly.id} className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-orange-300 capitalize">
                                  {anomaly.type}
                                </span>
                                <span className="text-xs text-orange-400">
                                  {anomaly.severity}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 leading-relaxed">
                                {anomaly.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIInsights;