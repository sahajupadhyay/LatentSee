'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import * as Icons from 'lucide-react';
import { usePerformanceDashboard, getCacheHitRateData } from '@/lib/context/PerformanceDashboardContext';

interface CacheHitRateVisualizationProps {
  showDetailedMetrics?: boolean;
  showEfficiencyBars?: boolean;
  height?: number;
}

const modelColors = {
  'Neural Authority': '#EF4444', // Red
  'Neural Cache': '#00C6AE',     // Accent teal
  'Smart Memory': '#A855F7'      // Purple
};

const hitMissColors = {
  hit: '#10B981',    // Green for hits
  miss: '#EF4444',   // Red for misses
  cache: '#00C6AE',  // Accent for cache efficiency
  direct: '#6B7280'  // Gray for direct database
};

// Custom tooltip for pie charts
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-primary-900/95 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 shadow-xl">
        <p className="text-white font-medium mb-2">{data.name}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-green-400 text-sm">Hit Rate:</span>
            <span className="text-white font-bold">{data.hitRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-red-400 text-sm">Miss Rate:</span>
            <span className="text-white font-bold">{data.missRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-300 text-sm">Requests:</span>
            <span className="text-accent-300 font-bold">{data.requests}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Cache efficiency comparison bar chart
const CacheEfficiencyBars = ({ data }: { data: any[] }) => {
  if (data.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Icons.TrendingUp className="w-5 h-5 text-accent-400" />
        Cache Efficiency Comparison
      </h4>
      
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
          <XAxis 
            dataKey="name" 
            stroke="#64748b"
            fontSize={12}
            interval={0}
            angle={-45}
            textAnchor="end"
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            domain={[0, 100]}
            label={{ value: 'Hit Rate (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-primary-900/95 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 shadow-xl">
                    <p className="text-white font-medium mb-2">{label}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-green-400 text-sm">Hit Rate:</span>
                        <span className="text-white font-bold">{data.hitRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-neutral-300 text-sm">Total Requests:</span>
                        <span className="text-accent-300 font-bold">{data.requests}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="hitRate" 
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Individual model cache performance card
const ModelCacheCard = ({ 
  modelName, 
  hitRate, 
  requests, 
  color 
}: {
  modelName: string;
  hitRate: number;
  requests: number;
  color: string;
}) => {
  const missRate = 100 - hitRate;
  const pieData = [
    { name: 'Hits', value: hitRate, color: hitMissColors.hit },
    { name: 'Misses', value: missRate, color: hitMissColors.miss }
  ];

  const getEfficiencyLevel = (rate: number) => {
    if (rate >= 80) return { level: 'Excellent', color: 'text-green-400' };
    if (rate >= 60) return { level: 'Good', color: 'text-accent-400' };
    if (rate >= 40) return { level: 'Fair', color: 'text-yellow-400' };
    return { level: 'Poor', color: 'text-red-400' };
  };

  const efficiency = getEfficiencyLevel(hitRate);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-primary-800/30 rounded-xl p-6 border border-primary-600/20 hover:border-primary-500/40 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h4 className="text-lg font-semibold text-white">{modelName}</h4>
      </div>

      {/* Pie chart */}
      <div className="relative h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-primary-900/95 backdrop-blur-sm border border-primary-700/50 rounded-lg p-2 shadow-xl">
                      <span className="text-white text-sm font-medium">
                        {payload[0].name}: {payload[0].value.toFixed(1)}%
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {hitRate.toFixed(0)}%
            </div>
            <div className="text-xs text-neutral-400">Hit Rate</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Requests</span>
          <span className="text-white font-medium">{requests.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Efficiency</span>
          <span className={`font-medium ${efficiency.color}`}>{efficiency.level}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Cache Hits</span>
          <span className="text-green-400 font-medium">
            {Math.round(requests * hitRate / 100).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Cache Misses</span>
          <span className="text-red-400 font-medium">
            {Math.round(requests * missRate / 100).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default function CacheHitRateVisualization({ 
  showDetailedMetrics = true,
  showEfficiencyBars = true,
  height = 300
}: CacheHitRateVisualizationProps) {
  const { state } = usePerformanceDashboard();

  // Prepare cache hit rate data
  const cacheData = useMemo(() => {
    return getCacheHitRateData(state.analytics);
  }, [state.analytics]);

  // Overall cache statistics
  const overallStats = useMemo(() => {
    const totalRequests = cacheData.reduce((sum, item) => sum + item.requests, 0);
    const weightedHitRate = cacheData.reduce((sum, item) => 
      sum + (item.hitRate * item.requests), 0
    ) / (totalRequests || 1);

    return {
      totalRequests,
      overallHitRate: weightedHitRate,
      overallMissRate: 100 - weightedHitRate,
      modelsActive: cacheData.length
    };
  }, [cacheData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icons.PieChart className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-heading font-semibold text-white">
              Cache Hit Rate Analysis
            </h3>
            <p className="text-sm text-neutral-400">
              Cache effectiveness across consistency models
            </p>
          </div>
        </div>
        
        {/* Overall stats */}
        <div className="text-right">
          <div className="text-2xl font-bold text-accent-300">
            {overallStats.overallHitRate.toFixed(1)}%
          </div>
          <div className="text-xs text-neutral-400">
            Overall Hit Rate
          </div>
        </div>
      </div>

      {cacheData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-neutral-400">
          <div className="text-center">
            <Icons.PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No cache data available</p>
            <p className="text-sm">Run API tests to see cache performance metrics</p>
          </div>
        </div>
      ) : (
        <>
          {/* Individual model cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {cacheData.map((model) => (
              <ModelCacheCard
                key={model.name}
                modelName={model.name}
                hitRate={model.hitRate}
                requests={model.requests}
                color={modelColors[model.name as keyof typeof modelColors]}
              />
            ))}
          </div>

          {/* Efficiency comparison bar chart */}
          {showEfficiencyBars && (
            <CacheEfficiencyBars data={cacheData} />
          )}

          {/* Detailed metrics table */}
          {showDetailedMetrics && cacheData.length > 0 && (
            <div className="mt-6 bg-primary-800/20 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icons.BarChart3 className="w-5 h-5 text-accent-400" />
                Detailed Metrics
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-600/30">
                      <th className="text-left text-neutral-400 font-medium pb-3">Model</th>
                      <th className="text-right text-neutral-400 font-medium pb-3">Requests</th>
                      <th className="text-right text-neutral-400 font-medium pb-3">Hit Rate</th>
                      <th className="text-right text-neutral-400 font-medium pb-3">Cache Hits</th>
                      <th className="text-right text-neutral-400 font-medium pb-3">Cache Misses</th>
                      <th className="text-right text-neutral-400 font-medium pb-3">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cacheData.map((model, index) => (
                      <tr 
                        key={model.name}
                        className={`${index !== cacheData.length - 1 ? 'border-b border-primary-700/20' : ''}`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: modelColors[model.name as keyof typeof modelColors] }}
                            />
                            <span className="text-white font-medium">{model.name}</span>
                          </div>
                        </td>
                        <td className="text-right text-neutral-300 py-3">
                          {model.requests.toLocaleString()}
                        </td>
                        <td className="text-right py-3">
                          <span className="text-accent-300 font-bold">
                            {model.hitRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right text-green-400 py-3">
                          {Math.round(model.requests * model.hitRate / 100).toLocaleString()}
                        </td>
                        <td className="text-right text-red-400 py-3">
                          {Math.round(model.requests * model.missRate / 100).toLocaleString()}
                        </td>
                        <td className="text-right py-3">
                          <span className={
                            model.hitRate >= 80 ? 'text-green-400' :
                            model.hitRate >= 60 ? 'text-accent-400' :
                            model.hitRate >= 40 ? 'text-yellow-400' : 'text-red-400'
                          }>
                            {model.hitRate >= 80 ? 'Excellent' :
                             model.hitRate >= 60 ? 'Good' :
                             model.hitRate >= 40 ? 'Fair' : 'Poor'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary-700/30">
            <div className="text-sm text-neutral-400">
              {overallStats.modelsActive} models • {overallStats.totalRequests.toLocaleString()} total requests
            </div>
            <div className="text-sm text-neutral-400">
              Average cache effectiveness: {overallStats.overallHitRate.toFixed(1)}%
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}