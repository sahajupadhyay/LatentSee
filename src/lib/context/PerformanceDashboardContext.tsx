'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { format } from 'date-fns';

// Types for performance dashboard
export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  modelName: 'Neural Authority' | 'Neural Cache' | 'Smart Memory';
  endpoint: string;
  responseTime: number;
  cacheStatus: 'HIT' | 'MISS' | 'EVICTED' | 'EXPIRED' | 'ERROR';
  cachePolicy: string;
  hitRate: number;
  fromCache: boolean;
  efficiency: string;
  requestId: string;
  dataCount: number;
}

export interface CacheAnalytics {
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  modelMetrics: {
    [key: string]: {
      requests: number;
      averageLatency: number;
      hitRate: number;
      efficiency: number;
    };
  };
}

export interface PerformanceDashboardState {
  metrics: PerformanceMetric[];
  analytics: CacheAnalytics;
  isRecording: boolean;
  timeRange: '5m' | '15m' | '1h' | '6h' | '24h';
  selectedModels: string[];
  exportData: any[];
  lastUpdated: Date | null;
}

// Actions for performance dashboard
type PerformanceDashboardAction =
  | { type: 'ADD_METRIC'; payload: PerformanceMetric }
  | { type: 'CLEAR_METRICS' }
  | { type: 'SET_TIME_RANGE'; payload: '5m' | '15m' | '1h' | '6h' | '24h' }
  | { type: 'TOGGLE_MODEL'; payload: string }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'UPDATE_ANALYTICS' }
  | { type: 'SET_EXPORT_DATA'; payload: any[] };

// Initial state
const initialState: PerformanceDashboardState = {
  metrics: [],
  analytics: {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    averageResponseTime: 0,
    modelMetrics: {}
  },
  isRecording: true,
  timeRange: '15m',
  selectedModels: ['Neural Authority', 'Neural Cache', 'Smart Memory'],
  exportData: [],
  lastUpdated: null
};

// Helper function to calculate analytics
const calculateAnalytics = (metrics: PerformanceMetric[]): CacheAnalytics => {
  if (metrics.length === 0) {
    return initialState.analytics;
  }

  const totalRequests = metrics.length;
  const totalHits = metrics.filter(m => m.fromCache).length;
  const totalMisses = totalRequests - totalHits;
  const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;

  const modelMetrics: { [key: string]: {
    requests: number;
    averageLatency: number;
    hitRate: number;
    efficiency: number;
  } } = {};
  
  // Calculate per-model metrics
  const modelGroups = metrics.reduce((groups, metric) => {
    if (!groups[metric.modelName]) {
      groups[metric.modelName] = [];
    }
    groups[metric.modelName].push(metric);
    return groups;
  }, {} as { [key: string]: PerformanceMetric[] });

  Object.entries(modelGroups).forEach(([modelName, modelMetricsArray]) => {
    const requests = modelMetricsArray.length;
    const hits = modelMetricsArray.filter(m => m.fromCache).length;
    const averageLatency = modelMetricsArray.reduce((sum, m) => sum + m.responseTime, 0) / requests;
    const hitRate = requests > 0 ? (hits / requests) * 100 : 0;
    const efficiency = modelMetricsArray.filter(m => m.efficiency === 'optimal').length / requests * 100;

    modelMetrics[modelName] = {
      requests,
      averageLatency: Math.round(averageLatency * 100) / 100,
      hitRate: Math.round(hitRate * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100
    };
  });

  return {
    totalRequests,
    totalHits,
    totalMisses,
    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    modelMetrics
  };
};

// Helper function to filter metrics by time range
const filterMetricsByTimeRange = (
  metrics: PerformanceMetric[], 
  timeRange: string
): PerformanceMetric[] => {
  const now = new Date();
  const timeRangeMs = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  };

  const cutoff = new Date(now.getTime() - timeRangeMs[timeRange as keyof typeof timeRangeMs]);
  return metrics.filter(metric => metric.timestamp >= cutoff);
};

// Reducer function
function performanceDashboardReducer(
  state: PerformanceDashboardState,
  action: PerformanceDashboardAction
): PerformanceDashboardState {
  switch (action.type) {
    case 'ADD_METRIC':
      if (!state.isRecording) return state;
      
      const newMetrics = [...state.metrics, action.payload];
      const filteredMetrics = filterMetricsByTimeRange(newMetrics, state.timeRange);
      
      return {
        ...state,
        metrics: filteredMetrics,
        analytics: calculateAnalytics(filteredMetrics),
        lastUpdated: new Date()
      };

    case 'CLEAR_METRICS':
      return {
        ...state,
        metrics: [],
        analytics: initialState.analytics,
        lastUpdated: new Date()
      };

    case 'SET_TIME_RANGE':
      const timeFilteredMetrics = filterMetricsByTimeRange(state.metrics, action.payload);
      return {
        ...state,
        timeRange: action.payload,
        metrics: timeFilteredMetrics,
        analytics: calculateAnalytics(timeFilteredMetrics)
      };

    case 'TOGGLE_MODEL':
      const updatedModels = state.selectedModels.includes(action.payload)
        ? state.selectedModels.filter(model => model !== action.payload)
        : [...state.selectedModels, action.payload];
      
      return {
        ...state,
        selectedModels: updatedModels
      };

    case 'START_RECORDING':
      return {
        ...state,
        isRecording: true
      };

    case 'STOP_RECORDING':
      return {
        ...state,
        isRecording: false
      };

    case 'UPDATE_ANALYTICS':
      return {
        ...state,
        analytics: calculateAnalytics(state.metrics)
      };

    case 'SET_EXPORT_DATA':
      return {
        ...state,
        exportData: action.payload
      };

    default:
      return state;
  }
}

// Context
const PerformanceDashboardContext = createContext<{
  state: PerformanceDashboardState;
  dispatch: React.Dispatch<PerformanceDashboardAction>;
  addMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => void;
  exportToCSV: () => string;
  exportToJSON: () => string;
} | undefined>(undefined);

// Provider component
export function PerformanceDashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(performanceDashboardReducer, initialState);

  const addMetric = (metricData: Omit<PerformanceMetric, 'id' | 'timestamp'>) => {
    const metric: PerformanceMetric = {
      ...metricData,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    dispatch({ type: 'ADD_METRIC', payload: metric });
  };

  const exportToCSV = (): string => {
    if (state.metrics.length === 0) return '';

    const headers = [
      'Timestamp',
      'Model Name',
      'Endpoint',
      'Response Time (ms)',
      'Cache Status',
      'Cache Policy',
      'Hit Rate (%)',
      'From Cache',
      'Efficiency',
      'Request ID',
      'Data Count'
    ].join(',');

    const rows = state.metrics.map(metric => [
      format(metric.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      metric.modelName,
      metric.endpoint,
      metric.responseTime,
      metric.cacheStatus,
      metric.cachePolicy,
      metric.hitRate,
      metric.fromCache,
      metric.efficiency,
      metric.requestId,
      metric.dataCount
    ].join(','));

    return [headers, ...rows].join('\n');
  };

  const exportToJSON = (): string => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      timeRange: state.timeRange,
      analytics: state.analytics,
      metrics: state.metrics.map(metric => ({
        ...metric,
        timestamp: metric.timestamp.toISOString()
      }))
    };

    return JSON.stringify(exportData, null, 2);
  };

  return (
    <PerformanceDashboardContext.Provider 
      value={{ 
        state, 
        dispatch, 
        addMetric,
        exportToCSV,
        exportToJSON
      }}
    >
      {children}
    </PerformanceDashboardContext.Provider>
  );
}

// Custom hook
export function usePerformanceDashboard() {
  const context = useContext(PerformanceDashboardContext);
  if (context === undefined) {
    throw new Error('usePerformanceDashboard must be used within a PerformanceDashboardProvider');
  }
  return context;
}

// Utility functions for charts
export const getChartDataForLatency = (metrics: PerformanceMetric[], selectedModels: string[]) => {
  return metrics
    .filter(metric => selectedModels.includes(metric.modelName))
    .map(metric => ({
      timestamp: format(metric.timestamp, 'HH:mm:ss'),
      [metric.modelName]: metric.responseTime,
      fullTime: metric.timestamp
    }))
    .sort((a, b) => a.fullTime.getTime() - b.fullTime.getTime());
};

export const getCacheHitRateData = (analytics: CacheAnalytics) => {
  return Object.entries(analytics.modelMetrics).map(([modelName, metrics]) => ({
    name: modelName,
    hitRate: metrics.hitRate,
    missRate: 100 - metrics.hitRate,
    requests: metrics.requests
  }));
};

export const getEfficiencyComparisonData = (analytics: CacheAnalytics) => {
  return Object.entries(analytics.modelMetrics).map(([modelName, metrics]) => ({
    model: modelName,
    averageLatency: metrics.averageLatency,
    hitRate: metrics.hitRate,
    efficiency: metrics.efficiency,
    requests: metrics.requests
  }));
};