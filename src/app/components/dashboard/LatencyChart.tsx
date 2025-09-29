'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import * as Icons from 'lucide-react';
import { usePerformanceDashboard, getChartDataForLatency } from '@/lib/context/PerformanceDashboardContext';

interface LatencyChartProps {
  height?: number;
  showTimeRangeSelector?: boolean;
  showModelSelector?: boolean;
  showStatistics?: boolean;
}

const modelColors = {
  'Neural Authority': '#EF4444', // Red - Direct database (highest latency, most accurate)
  'Neural Cache': '#00C6AE',     // Accent teal - TTL cache (balanced)
  'Smart Memory': '#A855F7'      // Purple - LRU cache (intelligent caching)
};

const modelInfo = {
  'Neural Authority': {
    description: 'Direct database queries',
    icon: Icons.Database,
    expectedLatency: '200-500ms'
  },
  'Neural Cache': {
    description: 'TTL-based caching',
    icon: Icons.Clock,
    expectedLatency: '50-200ms'
  },
  'Smart Memory': {
    description: 'LRU intelligent caching',
    icon: Icons.Brain,
    expectedLatency: '30-150ms'
  }
};

const timeRangeOptions = [
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' }
];

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary-900/95 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 shadow-xl">
        <p className="text-white font-medium mb-2">{`Time: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-neutral-200 text-sm">
              {entry.dataKey}: <span className="font-bold text-accent-300">{entry.value}ms</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Statistics panel
const LatencyStatistics = ({ data, selectedModels }: { 
  data: any[], 
  selectedModels: string[] 
}) => {
  const stats = useMemo(() => {
    const modelStats: { [key: string]: { 
      min: number, 
      max: number, 
      avg: number, 
      count: number,
      trend: 'up' | 'down' | 'stable'
    } } = {};

    selectedModels.forEach(model => {
      const modelData = data
        .map(d => d[model])
        .filter(v => v !== undefined && v !== null);
      
      if (modelData.length > 0) {
        const min = Math.min(...modelData);
        const max = Math.max(...modelData);
        const avg = modelData.reduce((sum, val) => sum + val, 0) / modelData.length;
        
        // Calculate trend (simple: compare first and last values)
        const firstHalf = modelData.slice(0, Math.floor(modelData.length / 2));
        const secondHalf = modelData.slice(Math.floor(modelData.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (secondAvg > firstAvg * 1.1) trend = 'up';
        else if (secondAvg < firstAvg * 0.9) trend = 'down';
        
        modelStats[model] = {
          min: Math.round(min),
          max: Math.round(max),
          avg: Math.round(avg),
          count: modelData.length,
          trend
        };
      }
    });

    return modelStats;
  }, [data, selectedModels]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Object.entries(stats).map(([model, stat]) => {
        const IconComponent = modelInfo[model as keyof typeof modelInfo].icon;
        return (
          <motion.div
            key={model}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-800/30 rounded-xl p-4 border border-primary-600/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: modelColors[model as keyof typeof modelColors] }}
              />
              <IconComponent className="w-4 h-4 text-neutral-400" />
              <span className="text-white font-medium text-sm">{model}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-accent-300">{stat.avg}ms</div>
                <div className="text-xs text-neutral-500">Average</div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-300">{stat.min}-{stat.max}ms</div>
                <div className="text-xs text-neutral-500">Range</div>
              </div>
              <div className="flex items-center justify-center">
                {stat.trend === 'up' && <Icons.TrendingUp className="w-4 h-4 text-alert-400" />}
                {stat.trend === 'down' && <Icons.TrendingDown className="w-4 h-4 text-green-400" />}
                {stat.trend === 'stable' && <Icons.Minus className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default function LatencyChart({ 
  height = 400,
  showTimeRangeSelector = true,
  showModelSelector = true,
  showStatistics = true
}: LatencyChartProps) {
  const { state, dispatch } = usePerformanceDashboard();
  const [isExpanded, setIsExpanded] = useState(false);

  // Prepare chart data
  const chartData = useMemo(() => {
    return getChartDataForLatency(state.metrics, state.selectedModels);
  }, [state.metrics, state.selectedModels]);

  // Calculate average response time for reference line
  const averageResponseTime = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    const allValues = chartData.reduce((acc, item) => {
      state.selectedModels.forEach(model => {
        if (item[model] !== undefined && typeof item[model] === 'number') {
          acc.push(item[model] as number);
        }
      });
      return acc;
    }, [] as number[]);
    
    return allValues.length > 0 
      ? Math.round(allValues.reduce((sum, val) => sum + val, 0) / allValues.length)
      : 0;
  }, [chartData, state.selectedModels]);

  const handleTimeRangeChange = (timeRange: any) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: timeRange });
  };

  const handleModelToggle = (model: string) => {
    dispatch({ type: 'TOGGLE_MODEL', payload: model });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icons.Activity className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-heading font-semibold text-white">
              Real-time Latency Analysis
            </h3>
            <p className="text-sm text-neutral-400">
              Response time comparison across consistency models
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Recording indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${state.isRecording ? 'bg-green-400 animate-pulse' : 'bg-neutral-500'}`} />
            <span className="text-xs text-neutral-400">
              {state.isRecording ? 'Recording' : 'Paused'}
            </span>
          </div>
          
          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-primary-700/30 rounded-lg transition-colors"
          >
            {isExpanded ? 
              <Icons.Minimize2 className="w-4 h-4 text-neutral-400" /> : 
              <Icons.Maximize2 className="w-4 h-4 text-neutral-400" />
            }
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Time range selector */}
        {showTimeRangeSelector && (
          <div className="flex items-center gap-2">
            <Icons.Clock className="w-4 h-4 text-neutral-400" />
            <select 
              value={state.timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="bg-primary-800/50 border border-primary-600/30 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-accent-400 transition-colors"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Model selector */}
        {showModelSelector && (
          <div className="flex items-center gap-2 flex-wrap">
            <Icons.Filter className="w-4 h-4 text-neutral-400" />
            {Object.keys(modelColors).map(model => (
              <button
                key={model}
                onClick={() => handleModelToggle(model)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all ${
                  state.selectedModels.includes(model)
                    ? 'bg-opacity-20 text-white'
                    : 'bg-primary-700/30 text-neutral-400 hover:text-neutral-200'
                }`}
                style={{
                  backgroundColor: state.selectedModels.includes(model)
                    ? `${modelColors[model as keyof typeof modelColors]}20`
                    : undefined
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: modelColors[model as keyof typeof modelColors] }}
                />
                {model}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {showStatistics && chartData.length > 0 && (
        <LatencyStatistics data={chartData} selectedModels={state.selectedModels} />
      )}

      {/* Chart */}
      <div className="relative">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-neutral-400">
            <div className="text-center">
              <Icons.BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">No data available</p>
              <p className="text-sm">Start testing APIs to see real-time latency</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isExpanded ? height * 1.5 : height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#64748b"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#e2e8f0' }}
                iconType="line"
              />
              
              {/* Average reference line */}
              {averageResponseTime > 0 && (
                <ReferenceLine 
                  y={averageResponseTime} 
                  stroke="#64748b" 
                  strokeDasharray="5 5" 
                  label={{ value: `Avg: ${averageResponseTime}ms`, position: 'top' }}
                />
              )}

              {/* Lines for each selected model */}
              {state.selectedModels.map(model => (
                <Line
                  key={model}
                  type="monotone"
                  dataKey={model}
                  stroke={modelColors[model as keyof typeof modelColors]}
                  strokeWidth={2}
                  dot={{ fill: modelColors[model as keyof typeof modelColors], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: modelColors[model as keyof typeof modelColors], strokeWidth: 2 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-700/30">
        <div className="text-sm text-neutral-400">
          {state.lastUpdated && (
            <span>Last updated: {state.lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="text-sm text-neutral-400">
          {chartData.length} data points • {state.selectedModels.length} models
        </div>
      </div>
    </motion.div>
  );
}