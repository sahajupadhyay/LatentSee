'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ComposedChart,
  Line,
  Area
} from 'recharts';
import * as Icons from 'lucide-react';
import { usePerformanceDashboard, getEfficiencyComparisonData } from '@/lib/context/PerformanceDashboardContext';

interface PerformanceComparisonProps {
  showScatterPlot?: boolean;
  showStatisticalAnalysis?: boolean;
  height?: number;
}

const modelColors = {
  'Neural Authority': '#EF4444', // Red
  'Neural Cache': '#00C6AE',     // Accent teal
  'Smart Memory': '#A855F7'      // Purple
};

const analysisTypes = [
  { id: 'latency', label: 'Latency Analysis', icon: Icons.Zap },
  { id: 'efficiency', label: 'Cache Efficiency', icon: Icons.Target },
  { id: 'consistency', label: 'Consistency vs Speed', icon: Icons.Scale },
  { id: 'correlation', label: 'Performance Correlation', icon: Icons.TrendingUp }
];

// Advanced statistics calculations
const calculateStatistics = (data: number[]) => {
  if (data.length === 0) return null;
  
  const sorted = data.slice().sort((a, b) => a - b);
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  
  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    min: Math.min(...data),
    max: Math.max(...data),
    q1: Math.round(q1 * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
    count: data.length
  };
};

// Statistical Analysis Panel
const StatisticalAnalysisPanel = ({ metrics }: { metrics: any[] }) => {
  const modelStats = useMemo(() => {
    const stats: { [key: string]: any } = {};
    
    const modelGroups = metrics.reduce((groups, metric) => {
      if (!groups[metric.modelName]) {
        groups[metric.modelName] = [];
      }
      groups[metric.modelName].push(metric);
      return groups;
    }, {} as { [key: string]: any[] });

    Object.entries(modelGroups).forEach(([modelName, modelMetricsArray]) => {
      const metricsArray = modelMetricsArray as any[];
      const latencies = metricsArray.map((m: any) => m.responseTime);
      const hitRates = metricsArray.map((m: any) => m.hitRate || 0);
      
      stats[modelName] = {
        latency: calculateStatistics(latencies),
        hitRate: calculateStatistics(hitRates),
        sampleSize: metricsArray.length
      };
    });

    return stats;
  }, [metrics]);

  return (
    <div className="bg-primary-800/30 rounded-xl p-6 border border-primary-600/20">
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Icons.BarChart3 className="w-5 h-5 text-accent-400" />
        Statistical Analysis
      </h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(modelStats).map(([modelName, stats]) => (
          <div 
            key={modelName}
            className="bg-primary-700/30 rounded-lg p-4 border border-primary-600/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: modelColors[modelName as keyof typeof modelColors] }}
              />
              <h5 className="font-medium text-white">{modelName}</h5>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-neutral-400 mb-1">Latency Statistics (ms)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-accent-300">Mean:</span> {stats.latency?.mean || 'N/A'}
                  </div>
                  <div>
                    <span className="text-accent-300">Median:</span> {stats.latency?.median || 'N/A'}
                  </div>
                  <div>
                    <span className="text-accent-300">Std Dev:</span> {stats.latency?.stdDev || 'N/A'}
                  </div>
                  <div>
                    <span className="text-accent-300">Range:</span> {stats.latency?.min || 'N/A'}-{stats.latency?.max || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-primary-600/30 pt-2">
                <div className="text-neutral-400 mb-1">Sample Size</div>
                <div className="text-white font-medium">{stats.sampleSize} requests</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Latency vs Efficiency Scatter Plot
const LatencyEfficiencyScatter = ({ data }: { data: any[] }) => {
  const scatterData = useMemo(() => {
    return data.map(item => ({
      x: item.averageLatency,
      y: item.hitRate,
      model: item.model,
      requests: item.requests,
      efficiency: item.efficiency
    }));
  }, [data]);

  if (scatterData.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Icons.TrendingUp className="w-5 h-5 text-accent-400" />
        Latency vs Cache Hit Rate Correlation
      </h4>
      
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Avg Latency (ms)" 
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Hit Rate (%)" 
            stroke="#64748b"
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-primary-900/95 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 shadow-xl">
                    <p className="text-white font-medium mb-2">{data.model}</p>
                    <div className="space-y-1 text-sm">
                      <div>Avg Latency: <span className="text-accent-300">{data.x}ms</span></div>
                      <div>Hit Rate: <span className="text-green-400">{data.y.toFixed(1)}%</span></div>
                      <div>Requests: <span className="text-neutral-300">{data.requests}</span></div>
                      <div>Efficiency: <span className="text-purple-400">{data.efficiency.toFixed(1)}%</span></div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {Object.keys(modelColors).map(modelName => (
            <Scatter
              key={modelName}
              data={scatterData.filter(d => d.model === modelName)}
              fill={modelColors[modelName as keyof typeof modelColors]}
              stroke={modelColors[modelName as keyof typeof modelColors]}
              strokeWidth={2}
              r={8}
            />
          ))}
          
          {/* Ideal efficiency reference lines */}
          <ReferenceLine y={80} stroke="#10B981" strokeDasharray="5 5" />
          <ReferenceLine x={100} stroke="#EF4444" strokeDasharray="5 5" />
        </ScatterChart>
      </ResponsiveContainer>
      
      <div className="text-xs text-neutral-400 mt-2 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-green-400"></div>
          <span>80% Hit Rate Target</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-red-400"></div>
          <span>100ms Latency Target</span>
        </div>
      </div>
    </div>
  );
};

// Performance comparison bars
const PerformanceComparisonBars = ({ data, metric }: { 
  data: any[], 
  metric: 'averageLatency' | 'hitRate' | 'efficiency' 
}) => {
  const metricConfig = {
    averageLatency: {
      label: 'Average Latency (ms)',
      color: '#EF4444',
      domain: [0, 'dataMax'] as [number, 'dataMax'],
      format: (value: number) => `${value}ms`
    },
    hitRate: {
      label: 'Cache Hit Rate (%)',
      color: '#10B981',
      domain: [0, 100],
      format: (value: number) => `${value.toFixed(1)}%`
    },
    efficiency: {
      label: 'Cache Efficiency (%)',
      color: '#A855F7',
      domain: [0, 100],
      format: (value: number) => `${value.toFixed(1)}%`
    }
  };

  const config = metricConfig[metric];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
        <XAxis 
          dataKey="model" 
          stroke="#64748b"
          fontSize={12}
          interval={0}
          angle={-45}
          textAnchor="end"
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          domain={config.domain}
          label={{ value: config.label, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const value = payload[0].value as number;
              return (
                <div className="bg-primary-900/95 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 shadow-xl">
                  <p className="text-white font-medium mb-1">{label}</p>
                  <p className="text-accent-300 font-bold">{config.format(value)}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar 
          dataKey={metric} 
          fill={config.color}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function PerformanceComparison({ 
  showScatterPlot = true,
  showStatisticalAnalysis = true,
  height = 400
}: PerformanceComparisonProps) {
  const { state } = usePerformanceDashboard();
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('latency');

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    return getEfficiencyComparisonData(state.analytics);
  }, [state.analytics]);

  const metricMapping = {
    latency: 'averageLatency',
    efficiency: 'hitRate',
    consistency: 'efficiency',
    correlation: 'averageLatency'
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icons.BarChart className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-heading font-semibold text-white">
              Performance Comparison Dashboard
            </h3>
            <p className="text-sm text-neutral-400">
              Academic research analytics and model comparison
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {analysisTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedAnalysis(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedAnalysis === type.id
                  ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                  : 'bg-primary-700/30 text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      {comparisonData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-neutral-400">
          <div className="text-center">
            <Icons.BarChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No comparison data available</p>
            <p className="text-sm">Run multiple API tests to see comparative analysis</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAnalysis}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Main comparison chart */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {selectedAnalysis === 'latency' && <Icons.Zap className="w-5 h-5 text-accent-400" />}
                {selectedAnalysis === 'efficiency' && <Icons.Target className="w-5 h-5 text-accent-400" />}
                {selectedAnalysis === 'consistency' && <Icons.Scale className="w-5 h-5 text-accent-400" />}
                {selectedAnalysis === 'correlation' && <Icons.TrendingUp className="w-5 h-5 text-accent-400" />}
                
                {analysisTypes.find(t => t.id === selectedAnalysis)?.label}
              </h4>

              {selectedAnalysis === 'correlation' && showScatterPlot ? (
                <LatencyEfficiencyScatter data={comparisonData} />
              ) : (
                <PerformanceComparisonBars 
                  data={comparisonData} 
                  metric={metricMapping[selectedAnalysis as keyof typeof metricMapping] as any}
                />
              )}
            </div>

            {/* Statistical analysis */}
            {showStatisticalAnalysis && selectedAnalysis !== 'correlation' && (
              <StatisticalAnalysisPanel metrics={state.metrics} />
            )}

            {/* Performance insights */}
            <div className="bg-primary-800/30 rounded-xl p-4 border border-primary-600/20">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Icons.Lightbulb className="w-5 h-5 text-accent-400" />
                Academic Insights
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h5 className="font-medium text-accent-300">Consistency-Latency Trade-offs</h5>
                  <ul className="space-y-1 text-neutral-300">
                    <li>• Neural Authority: High consistency, higher latency</li>
                    <li>• Smart Memory: Balanced approach with LRU optimization</li>
                    <li>• Neural Cache: Speed-optimized with TTL trade-offs</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h5 className="font-medium text-accent-300">Research Observations</h5>
                  <ul className="space-y-1 text-neutral-300">
                    <li>• Cache hit rates directly correlate with response times</li>
                    <li>• LRU shows adaptive performance based on access patterns</li>
                    <li>• TTL provides predictable but time-bounded consistency</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Summary statistics */}
            <div className="flex items-center justify-between pt-4 border-t border-primary-700/30">
              <div className="text-sm text-neutral-400">
                {comparisonData.length} models analyzed • {state.metrics.length} total requests
              </div>
              <div className="text-sm text-neutral-400">
                {state.lastUpdated && `Updated: ${state.lastUpdated.toLocaleTimeString()}`}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}