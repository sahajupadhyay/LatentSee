'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/app/components/ui';
import { 
  LatencyChart, 
  CacheHitRateVisualization, 
  PerformanceComparison, 
  DataExport,
  usePerformanceDashboard 
} from '@/app/components/dashboard';
import * as Icons from 'lucide-react';

export default function AnalyticsPage() {
  const { state } = usePerformanceDashboard();
  const router = useRouter();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-primary-950 relative overflow-hidden"
    >
      {/* Top Navigation */}
      <TopNav />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-heading font-bold text-white mb-2">
                Performance Analytics Dashboard
              </h1>
              <p className="text-lg text-neutral-400 max-w-2xl">
                Comprehensive real-time analysis of consistency-latency trade-offs across neural caching models
              </p>
            </div>
            
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-700/30 hover:bg-primary-600/40 border border-primary-600/20 hover:border-primary-500/40 rounded-lg transition-all text-sm text-neutral-300 hover:text-white"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              Back to Testing
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Icons.Activity className="w-5 h-5 text-accent-400" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {state.metrics.length}
                  </div>
                  <div className="text-sm text-neutral-400">Total Requests</div>
                </div>
              </div>
            </div>

            <div className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Icons.Target className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {state.analytics.totalHits}
                  </div>
                  <div className="text-sm text-neutral-400">Cache Hits</div>
                </div>
              </div>
            </div>

            <div className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Icons.Zap className="w-5 h-5 text-accent-400" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {state.analytics.averageResponseTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-neutral-400">Avg Response</div>
                </div>
              </div>
            </div>

            <div className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Icons.BarChart3 className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {Object.keys(state.analytics.modelMetrics).length}
                  </div>
                  <div className="text-sm text-neutral-400">Active Models</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        {state.metrics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Icons.BarChart3 className="w-20 h-20 mx-auto mb-6 text-neutral-500 opacity-50" />
            <h3 className="text-2xl font-semibold text-white mb-4">
              No Performance Data Yet
            </h3>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">
              Start testing the API endpoints to see comprehensive performance analytics and insights.
            </p>
            <button
              onClick={() => router.push('/#execution-section')}
              className="px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              Start API Testing
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Real-time Latency Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <LatencyChart 
                height={400}
                showTimeRangeSelector={true}
                showModelSelector={true}
                showStatistics={true}
              />
            </motion.div>
            
            {/* Cache Analytics Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <CacheHitRateVisualization 
                showDetailedMetrics={true}
                showEfficiencyBars={true}
                height={350}
              />
            </motion.div>
            
            {/* Advanced Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <PerformanceComparison 
                showScatterPlot={true}
                showStatisticalAnalysis={true}
                height={450}
              />
            </motion.div>
            
            {/* Data Export */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <DataExport 
                showQuickExport={true}
                showAdvancedOptions={true}
              />
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}