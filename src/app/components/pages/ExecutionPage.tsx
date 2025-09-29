'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Product, ApiResponse } from '@/lib/types';
import { Squares, SpotlightCard, BorderMagicButton } from '@/app/components/ui';
import { usePerformanceDashboard } from '@/app/components/dashboard';
import { useRouter } from 'next/navigation';

interface CacheMetrics {
  status?: string;
  policy?: string;
  hitRate?: string;
  responseTime?: string;
  fromCache?: string;
  efficiency?: string;
}

interface ExecutionState {
  data: Product[] | null;
  error: string | null;
  isLoading: boolean;
  requestMetadata: any;
  cacheMetrics: CacheMetrics | null;
  selectedProduct: Product | null;
  lastFetchMode: string | null;
}

// Professional Consistency Model Card using SpotlightCard
const ConsistencyCard = ({ 
  title, 
  description, 
  endpoint, 
  colorTheme, 
  onTest, 
  isLoading,
  isActive 
}: {
  title: string;
  description: string;
  endpoint: string;
  colorTheme: 'neural' | 'cache' | 'smart';
  onTest: (endpoint: string, mode: string) => void;
  isLoading: boolean;
  isActive: boolean;
}) => {
  const themeConfig = {
    neural: {
      spotlightColor: 'rgba(239, 68, 68, 0.3)' as const, // Red spotlight for Neural Authority
      icon: 'bg-red-500',
      text: 'group-hover:text-red-400',
      ring: 'ring-red-500',
      border: 'border-red-500'
    },
    cache: {
      spotlightColor: 'rgba(0, 198, 174, 0.3)' as const, // Accent teal for Neural Cache
      icon: 'bg-accent-500',
      text: 'group-hover:text-accent-400',
      ring: 'ring-accent-500',
      border: 'border-accent-500'
    },
    smart: {
      spotlightColor: 'rgba(168, 85, 247, 0.3)' as const, // Purple spotlight for Smart Memory
      icon: 'bg-purple-500',
      text: 'group-hover:text-purple-400',
      ring: 'ring-purple-500',
      border: 'border-purple-500'
    }
  };

  const theme = themeConfig[colorTheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02, 
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer group"
      onClick={() => onTest(endpoint, title)}
    >
      <SpotlightCard 
        className={`bg-black/70 transition-all duration-300 ${isActive ? `border-2 ${theme.border} shadow-xl` : 'border border-neutral-800'}`}
        spotlightColor={theme.spotlightColor}
      >
        {/* Title with typography system */}
        <h3 className="text-xl font-heading font-semibold mb-3 text-white">
          {title}
        </h3>
        
        {/* Description with proper line height */}
        <p className="text-neutral-200/80 text-sm font-body leading-relaxed mb-6">
          {description}
        </p>
        
        {/* CTA Section */}
        <div className="flex items-center justify-between">
          <BorderMagicButton 
            primaryColor={
              colorTheme === 'neural' ? '#EF4444' : 
              colorTheme === 'cache' ? '#00C6AE' : '#A855F7'
            }
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when button is clicked
              onTest(endpoint, title);
            }}
          >
            Test Performance
          </BorderMagicButton>
          
          {/* Loading spinner */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 }
                }}
                className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full"
              />
            )}
          </AnimatePresence>
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

// Quick Metrics Panel Component
const QuickMetricsPanel = ({ metrics, responseTime }: { 
  metrics: CacheMetrics | null; 
  responseTime?: number;
}) => {
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icons.Activity className="w-5 h-5 text-accent-400" />
          <h3 className="text-xl font-heading font-semibold text-white">Performance Metrics</h3>
        </div>
        <button
          onClick={() => router.push('/analytics')}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500/20 hover:bg-accent-500/30 border border-accent-400/30 hover:border-accent-400/50 rounded-lg transition-all text-sm text-accent-300 hover:text-accent-200"
        >
          <Icons.BarChart3 className="w-4 h-4" />
          View Full Analytics
          <Icons.ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-400 mb-1">
            {responseTime ? `${responseTime}ms` : '--'}
          </div>
          <div className="text-sm text-neutral-400">Response Time</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-400 mb-1">
            {metrics?.hitRate || '--'}
          </div>
          <div className="text-sm text-neutral-400">Cache Hit Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-alert-400 mb-1">
            {metrics?.fromCache || '--'}
          </div>
          <div className="text-sm text-neutral-400">From Cache</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-300 mb-1">
            {metrics?.efficiency || '--'}
          </div>
          <div className="text-sm text-neutral-400">Efficiency</div>
        </div>
      </div>
    </motion.div>
  );
};

// Product Grid Component
const ProductGrid = ({ products }: { products: Product[] }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
    className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
  >
    <div className="flex items-center gap-3 mb-6">
      <Icons.ShoppingCart className="w-5 h-5 text-accent-400" />
      <h3 className="text-xl font-heading font-semibold text-white">Product Intelligence</h3>
      <span className="px-3 py-1 bg-accent-500/20 text-accent-300 rounded-full text-xs font-medium">
        {products.length} items
      </span>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.slice(0, 6).map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-primary-800/30 rounded-xl p-4 border border-primary-600/20 hover:border-accent-400/40 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm mb-1 group-hover:text-accent-300 transition-colors">
                {product.name}
              </h4>
              <p className="text-neutral-400 text-xs line-clamp-2">
                {product.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-accent-400 font-bold text-sm">
                ₹{product.price}
              </div>
              <div className="text-neutral-500 text-xs">
                Stock: {product.inventory}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
              product.category === 'electronics' 
                ? 'bg-secondary-500/20 text-secondary-300'
                : 'bg-accent-500/20 text-accent-300'
            }`}>
              {product.category}
            </span>
            <Icons.TrendingUp className="w-4 h-4 text-neutral-500" />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default function ExecutionPage() {
  const { addMetric } = usePerformanceDashboard();
  const router = useRouter();
  const [state, setState] = useState<ExecutionState>({
    data: null,
    error: null,
    isLoading: false,
    requestMetadata: null,
    cacheMetrics: null,
    selectedProduct: null,
    lastFetchMode: null
  });

  const [responseTime, setResponseTime] = useState<number>();

  const handleApiCall = useCallback(async (endpoint: string, mode: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, lastFetchMode: mode }));
      
      const startTime = Date.now();
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const endTime = Date.now();
      const currentResponseTime = endTime - startTime;
      
      setResponseTime(currentResponseTime);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const cacheMetrics: CacheMetrics = {
        status: response.headers.get('X-Cache-Status') || undefined,
        policy: response.headers.get('X-Cache-Policy') || undefined,
        hitRate: response.headers.get('X-Cache-Hit-Rate') || undefined,
        responseTime: response.headers.get('X-Response-Time') || undefined,
        fromCache: response.headers.get('X-From-Cache') || undefined,
        efficiency: response.headers.get('X-Cache-Efficiency') || undefined,
      };

      // Add metric to performance dashboard
      addMetric({
        modelName: mode as 'Neural Authority' | 'Neural Cache' | 'Smart Memory',
        endpoint,
        responseTime: currentResponseTime,
        cacheStatus: (cacheMetrics.status as any) || 'MISS',
        cachePolicy: cacheMetrics.policy || 'none',
        hitRate: parseFloat(cacheMetrics.hitRate?.replace('%', '') || '0'),
        fromCache: cacheMetrics.fromCache === 'true',
        efficiency: cacheMetrics.efficiency || 'standard',
        requestId: result.metadata?.requestId || `req_${Date.now()}`,
        dataCount: (result.data as Product[])?.length || 0
      });

      setState(prev => ({
        ...prev,
        data: result.data || [],
        isLoading: false,
        requestMetadata: result.metadata,
        cacheMetrics
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false
      }));
    }
  }, [addMetric]);

  const consistencyModels = [
    {
      title: 'Neural Authority',
      description: 'Direct database query with guaranteed accuracy. Higher latency for absolute precision.',
      endpoint: '/api/always-fresh',
      colorTheme: 'neural' as const
    },
    {
      title: 'Neural Cache',
      description: 'TTL-based caching for lightning speed. Possible staleness within time window.',
      endpoint: '/api/check-fast',
      colorTheme: 'cache' as const
    },
    {
      title: 'Smart Memory',
      description: 'AI-optimized caching with predictive freshness. Balanced speed and accuracy.',
      endpoint: '/api/smart-memory',
      colorTheme: 'smart' as const
    }
  ];

  return (
    <div className="relative z-10 container mx-auto px-6 py-12">
      {/* Neural Consistency Models */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-16"
      >
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl font-heading font-bold mb-12 text-center text-white"
        >
          Neural Consistency Models
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {consistencyModels.map((model, index) => (
            <motion.div
              key={model.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
            >
              <ConsistencyCard
                {...model}
                onTest={handleApiCall}
                isLoading={state.isLoading && state.lastFetchMode === model.title}
                isActive={state.lastFetchMode === model.title}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8"
          >
            <div className="bg-alert-500/10 border border-alert-500/30 rounded-2xl p-6 text-center">
              <div className="text-alert-400 font-medium mb-2">Error Detected</div>
              <div className="text-neutral-300 text-sm">{state.error}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Metrics Panel */}
      {(state.cacheMetrics || responseTime) && (
        <div className="mb-8">
          <QuickMetricsPanel metrics={state.cacheMetrics} responseTime={responseTime} />
        </div>
      )}

      {/* Product Grid */}
      {state.data && state.data.length > 0 && (
        <ProductGrid products={state.data} />
      )}
    </div>
  );
}