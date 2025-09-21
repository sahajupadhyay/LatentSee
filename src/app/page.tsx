'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  ShoppingCart, 
  TrendingUp, 
  Eye, 
  Sparkles,
  Clock,
  Shield,
  Activity
} from 'lucide-react';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { Product, ApiResponse } from '@/lib/types';

interface CacheMetrics {
  status?: string;
  policy?: string;
  hitRate?: string;
  responseTime?: string;
  fromCache?: string;
  efficiency?: string;
}

interface DashboardState {
  data: Product[] | null;
  error: string | null;
  isLoading: boolean;
  requestMetadata: any;
  cacheMetrics: CacheMetrics | null;
  selectedProduct: Product | null;
  lastFetchMode: string | null;
}

// Professional Consistency Model Card
const ConsistencyCard = ({ 
  icon: Icon, 
  title, 
  description, 
  endpoint, 
  colorTheme, 
  onTest, 
  isLoading,
  isActive 
}: {
  icon: any;
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
      icon: 'bg-alert-500',
      glow: 'hover:shadow-alert-500/30',
      border: 'hover:border-alert-500/50',
      text: 'group-hover:text-alert-400',
      ring: 'ring-alert-500'
    },
    cache: {
      icon: 'bg-accent-500',
      glow: 'hover:shadow-accent-500/30',
      border: 'hover:border-accent-500/50',
      text: 'group-hover:text-accent-400',
      ring: 'ring-accent-500'
    },
    smart: {
      icon: 'bg-secondary-500',
      glow: 'hover:shadow-secondary-500/30',
      border: 'hover:border-secondary-500/50',
      text: 'group-hover:text-secondary-400',
      ring: 'ring-secondary-500'
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
      className={`
        bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 
        shadow-md hover:shadow-xl ${theme.glow} ${theme.border}
        transition-all duration-300 group relative overflow-hidden cursor-pointer
        ${isActive ? `ring-2 ${theme.ring} shadow-xl` : ''}
      `}
      onClick={() => onTest(endpoint, title)}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Icon with professional styling */}
        <motion.div 
          whileHover={{ rotate: 5 }}
          className={`inline-flex p-3 rounded-2xl ${theme.icon} mb-6 shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
        
        {/* Title with typography system */}
        <h3 className={`text-xl font-heading font-semibold mb-3 text-white ${theme.text} transition-colors duration-200`}>
          {title}
        </h3>
        
        {/* Description with proper line height */}
        <p className="text-neutral-200/80 text-sm font-body leading-relaxed mb-6">
          {description}
        </p>
        
        {/* CTA Section */}
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl font-medium text-sm bg-gradient-to-r from-accent-500 to-secondary-500 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Test Performance
          </motion.button>
          
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
      </div>
    </motion.div>
  );
};

// Metrics Panel Component
const MetricsPanel = ({ metrics, responseTime }: { 
  metrics: CacheMetrics | null; 
  responseTime?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
  >
    <div className="flex items-center gap-3 mb-4">
      <Activity className="w-5 h-5 text-accent-400" />
      <h3 className="text-xl font-heading font-semibold text-white">Performance Metrics</h3>
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

// Product Grid Component
const ProductGrid = ({ products }: { products: Product[] }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
    className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
  >
    <div className="flex items-center gap-3 mb-6">
      <ShoppingCart className="w-5 h-5 text-accent-400" />
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
            <TrendingUp className="w-4 h-4 text-neutral-500" />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

function DashboardContent() {
  const [state, setState] = useState<DashboardState>({
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
      
      setResponseTime(endTime - startTime);

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
  }, []);

  const consistencyModels = [
    {
      icon: Shield,
      title: 'Neural Authority',
      description: 'Direct database query with guaranteed accuracy. Higher latency for absolute precision.',
      endpoint: '/api/always-fresh',
      colorTheme: 'neural' as const
    },
    {
      icon: Zap,
      title: 'Neural Cache',
      description: 'TTL-based caching for lightning speed. Possible staleness within time window.',
      endpoint: '/api/check-fast',
      colorTheme: 'cache' as const
    },
    {
      icon: Brain,
      title: 'Smart Memory',
      description: 'AI-optimized caching with predictive freshness. Balanced speed and accuracy.',
      endpoint: '/api/smart-memory',
      colorTheme: 'smart' as const
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-secondary-900 relative overflow-hidden"
    >
      {/* Neural Grid Background - insights glowing from latent space */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0, 198, 174, 0.4) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-4 bg-accent-500/20 rounded-2xl backdrop-blur-sm shadow-lg"
            >
              <Eye className="w-10 h-10 text-accent-400" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-7xl font-heading font-bold bg-gradient-to-r from-accent-400 to-secondary-500 bg-clip-text text-transparent"
            >
              LatentSee
            </motion.h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-neutral-100/80 max-w-4xl mx-auto mb-8 leading-relaxed font-body"
          >
            Discover hidden patterns in real-time: See how cloud systems balance speed vs correctness in e-commerce scenarios
          </motion.p>
          
          {/* Feature badges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 bg-primary-800/50 backdrop-blur-sm rounded-2xl border border-primary-700/30 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-neutral-200 font-medium">Neural Caching</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 bg-primary-800/50 backdrop-blur-sm rounded-2xl border border-primary-700/30 shadow-md"
            >
              <TrendingUp className="w-4 h-4 text-secondary-400" />
              <span className="text-neutral-200 font-medium">Real-time Insights</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 bg-primary-800/50 backdrop-blur-sm rounded-2xl border border-primary-700/30 shadow-md"
            >
              <Clock className="w-4 h-4 text-alert-400" />
              <span className="text-neutral-200 font-medium">Latency Analysis</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Neural Consistency Models */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-16"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
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

        {/* Metrics Panel */}
        {(state.cacheMetrics || responseTime) && (
          <div className="mb-8">
            <MetricsPanel metrics={state.cacheMetrics} responseTime={responseTime} />
          </div>
        )}

        {/* Product Grid */}
        {state.data && state.data.length > 0 && (
          <ProductGrid products={state.data} />
        )}
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}