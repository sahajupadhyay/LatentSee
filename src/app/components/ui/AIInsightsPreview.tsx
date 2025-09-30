'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface AIPreviewProps {
  metricsCount: number;
  onRunTest?: () => void;
}

/**
 * AI Insights Preview Component
 * 
 * Shows users what AI insights will look like and encourages
 * them to run tests to unlock AI analysis.
 */
export const AIInsightsPreview = ({ metricsCount, onRunTest }: AIPreviewProps) => {
  const sampleInsights = [
    {
      icon: Icons.Zap,
      title: 'Performance Pattern Detection',
      description: 'AI identifies which consistency model performs best for your specific workload patterns.',
      color: 'text-blue-400'
    },
    {
      icon: Icons.Target,
      title: 'Smart Optimization Recommendations',
      description: 'Get actionable recommendations to improve cache hit rates and reduce latency.',
      color: 'text-green-400'
    },
    {
      icon: Icons.AlertTriangle,
      title: 'Anomaly Detection',
      description: 'Automatically detect unusual performance patterns and potential issues.',
      color: 'text-orange-400'
    },
    {
      icon: Icons.TrendingUp,
      title: 'Trend Analysis',
      description: 'Understand how your performance metrics change over time and different models.',
      color: 'text-purple-400'
    }
  ];

  const testsNeeded = Math.max(0, 2 - metricsCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-neutral-900/50 to-neutral-800/50 border border-neutral-700/50 rounded-2xl p-8 mb-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-4">
          <Icons.Brain className="text-blue-400" size={32} />
        </div>
        <h3 className="text-2xl font-semibold text-neutral-100 mb-2">
          AI-Powered Performance Insights
        </h3>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          {testsNeeded > 0 
            ? `Run ${testsNeeded} more test${testsNeeded !== 1 ? 's' : ''} to unlock intelligent analysis and recommendations`
            : 'Ready to analyze your performance data with AI-powered insights'
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-neutral-400 mb-2">
          <span>Progress</span>
          <span>{metricsCount}/2 tests completed</span>
        </div>
        <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (metricsCount / 2) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          />
        </div>
      </div>

      {/* Sample Insights Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {sampleInsights.map((insight, index) => {
          const IconComponent = insight.icon;
          const isUnlocked = metricsCount >= 2;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                isUnlocked 
                  ? 'bg-neutral-800/30 border-neutral-700/30'
                  : 'bg-neutral-800/10 border-neutral-700/20 opacity-60'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                isUnlocked 
                  ? `bg-neutral-700/50 ${insight.color}`
                  : 'bg-neutral-700/30 text-neutral-500'
              }`}>
                <IconComponent size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium mb-1 ${
                  isUnlocked ? 'text-neutral-200' : 'text-neutral-400'
                }`}>
                  {insight.title}
                  {!isUnlocked && (
                    <Icons.Lock className="inline-block ml-2 w-3 h-3 text-neutral-500" />
                  )}
                </h4>
                <p className={`text-sm leading-relaxed ${
                  isUnlocked ? 'text-neutral-400' : 'text-neutral-500'
                }`}>
                  {insight.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Call to Action */}
      {testsNeeded > 0 && (
        <div className="text-center">
          <button
            onClick={onRunTest}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all"
          >
            <Icons.Play size={16} />
            Run Your First Test
          </button>
          <p className="text-xs text-neutral-500 mt-2">
            Start with any consistency model above to begin collecting performance data
          </p>
        </div>
      )}

      {/* Budget Info */}
      <div className="mt-6 pt-6 border-t border-neutral-700/30">
        <div className="flex items-center justify-center gap-6 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <Icons.DollarSign size={12} />
            <span>Budget-optimized AI analysis</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Zap size={12} />
            <span>Real-time insights</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Shield size={12} />
            <span>Privacy-focused</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightsPreview;