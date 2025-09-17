'use client';

import { useState, useCallback, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button, Card, Alert, LoadingSpinner } from '@/components/ui';
import { Product, ApiResponse, SingleProductResponse } from '@/lib/types';

/**
 * Dashboard Component - Main interface for consistency model testing
 * 
 * Features:
 * - Error boundaries for graceful error handling
 * - Accessible UI components
 * - Loading states and user feedback
 * - Type-safe API interactions
 * - Performance metrics display
 */

interface CacheMetrics {
  status?: string;
  policy?: string;
  priority?: string;
  hitRate?: string;
  age?: string;
  responseTime?: string;
  cacheCheckTime?: string;
  dbTime?: string;
  fromCache?: string;
  efficiency?: string;
  size?: string;
  memoryUsage?: string;
}

interface DashboardState {
  data: Product[] | null;
  error: string | null;
  isLoading: boolean;
  requestMetadata: {
    requestId?: string;
    duration?: number;
    timestamp?: string;
  } | null;
  cacheMetrics: CacheMetrics | null;
  selectedProduct: Product | null;
  cart: CartItem[];
  lastFetchMode: string | null;
}

interface CartItem {
  product: Product;
  addedPrice: number;
  quantity: number;
  mode: string;
  addedAt: string;
}

function DashboardContent() {
  const [state, setState] = useState<DashboardState>({
    data: null,
    error: null,
    isLoading: false,
    requestMetadata: null,
    cacheMetrics: null,
    selectedProduct: null,
    cart: [],
    lastFetchMode: null
  });

  /**
   * Handles API calls with comprehensive error handling and state management
   */
  const handleApiCall = useCallback(async (endpoint: string, buttonName: string) => {
    try {
      const requestId = crypto.randomUUID();
      
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Request-ID': requestId
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SingleProductResponse = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Extract cache performance metrics from headers
      const cacheMetrics: CacheMetrics = {
        status: response.headers.get('X-Cache-Status') || undefined,
        policy: response.headers.get('X-Cache-Policy') || undefined,
        priority: response.headers.get('X-Cache-Priority') || undefined,
        hitRate: response.headers.get('X-Cache-Hit-Rate') || undefined,
        age: response.headers.get('X-Cache-Age') || undefined,
        responseTime: response.headers.get('X-Response-Time') || undefined,
        cacheCheckTime: response.headers.get('X-Cache-Check-Time') || undefined,
        dbTime: response.headers.get('X-DB-Time') || undefined,
        fromCache: response.headers.get('X-From-Cache') || undefined,
        efficiency: response.headers.get('X-Cache-Efficiency') || undefined,
        size: response.headers.get('X-Cache-Size') || undefined,
        memoryUsage: response.headers.get('X-Cache-Memory-Usage') || undefined,
      };

      setState(prev => ({
        ...prev,
        selectedProduct: result.product || prev.selectedProduct,
        lastFetchMode: buttonName.toLowerCase().replace(' ', '_'),
        requestMetadata: {
          requestId: result.metadata.requestId,
          duration: result.metadata.duration,
          timestamp: result.metadata.timestamp
        },
        cacheMetrics
      }));

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      setState(prev => ({
        ...prev,
        error: `${buttonName} failed: ${errorMessage}`
      }));
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, []);

  const handleAlwaysFresh = useCallback(() => {
    if (!state.selectedProduct) return;
    handleApiCall(`/api/always-fresh?id=${state.selectedProduct.id}`, 'Always Fresh');
  }, [handleApiCall, state.selectedProduct]);

  const handleCheckFast = useCallback(() => {
    if (!state.selectedProduct) return;
    handleApiCall(`/api/check-fast?id=${state.selectedProduct.id}`, 'Check Fast');
  }, [handleApiCall, state.selectedProduct]);

  const handleSmartMemory = useCallback(() => {
    if (!state.selectedProduct) return;
    handleApiCall(`/api/smart-memory?id=${state.selectedProduct.id}`, 'Smart Memory');
  }, [handleApiCall, state.selectedProduct]);

  // Load all products for the catalog
  const loadProducts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch('/api/always-fresh?loadAll=true');
      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        data: result.data || [],
        selectedProduct: result.data?.[0] || null,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load products',
        isLoading: false
      }));
    }
  }, []);

  // Select a product for demo
  const selectProduct = useCallback((product: Product) => {
    setState(prev => ({
      ...prev,
      selectedProduct: product,
      error: null
    }));
  }, []);

  // Add product to cart using the last fetched price/mode
  const addToCart = useCallback(async () => {
    if (!state.selectedProduct || !state.lastFetchMode || !state.requestMetadata) return;
    
    const cartItem: CartItem = {
      product: state.selectedProduct,
      addedPrice: state.selectedProduct.price,
      quantity: 1,
      mode: state.lastFetchMode,
      addedAt: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      cart: [...prev.cart, cartItem]
    }));
  }, [state.selectedProduct, state.lastFetchMode, state.requestMetadata]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: null,
      error: null,
      isLoading: false,
      requestMetadata: null,
      cacheMetrics: null
    }));
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 p-8 font-['Inter']">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Header */}
        <header className="relative mb-12 text-center bg-gradient-to-br from-slate-800/50 to-indigo-900/50 backdrop-blur-xl border border-white/10 rounded-3xl py-16 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-teal-400/20 to-transparent animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-gradient-to-br from-purple-400/20 to-transparent animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10">
            <h1 className="text-6xl font-bold mb-6 font-['Sora'] bg-gradient-to-r from-teal-400 to-purple-500 bg-clip-text text-transparent">
              LatentSee
            </h1>
            <p className="text-2xl mb-4 font-light text-slate-200">
              AI-Powered E-commerce Insights
            </p>
            <p className="text-lg opacity-80 max-w-2xl mx-auto leading-relaxed text-slate-300">
              Discover hidden patterns in real-time: See how cloud systems balance speed vs correctness in e-commerce scenarios
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium text-white">
                🧠 Neural Caching
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium text-white">
                ⚡ Real-time Insights
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium text-white">
                🎯 Latency Analysis
              </div>
            </div>
          </div>
        </header>

        {/* Main E-commerce Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Product Catalog - Left Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300 hover:-translate-y-2 shadow-lg hover:shadow-2xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-['Sora'] text-white">
                <span className="text-2xl">🛍️</span>
                Product Intelligence
              </h2>
              {state.isLoading && !state.data ? (
                <div className="flex flex-col items-center py-8">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-full mb-4 animate-pulse">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <p className="opacity-80 text-slate-300">AI analyzing products...</p>
                </div>
              ) : state.data ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {state.data.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] ${
                        state.selectedProduct?.id === product.id ? 'bg-gradient-to-r from-teal-500/20 to-purple-500/20 border-teal-400/50 ring-2 ring-teal-400/30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-sm leading-tight text-white">{product.name}</h4>
                        <div className="text-right">
                          <div className="text-lg font-bold text-teal-400">
                            ₹{(product.price / 100).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs opacity-80">
                        <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-2 py-1 rounded text-xs text-white">{product.brand}</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <span className={`w-2 h-2 rounded-full ${
                            product.inventory > 50 ? 'bg-green-400' : 
                            product.inventory > 10 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></span>
                          {product.inventory || 0} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-60">
                  <span className="text-4xl mb-4 block">🤖</span>
                  <p className="text-slate-300">No products in neural network</p>
                </div>
              )}
            </div>

            {/* Neural Shopping Cart */}
            {state.cart.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6 hover:bg-white/8 transition-all duration-300">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 font-['Sora'] text-white">
                  <span className="text-xl">🛒</span>
                  Neural Cart ({state.cart.length})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {state.cart.map((item, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/8 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm leading-tight mb-1 text-white">{item.product.name}</div>
                          <div className="flex items-center gap-2 text-xs opacity-80">
                            <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-2 py-1 rounded text-xs text-white">
                              {item.mode} mode
                            </span>
                            <span className="opacity-60 text-slate-400">•</span>
                            <span className="text-slate-300">{new Date(item.addedAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="text-sm ml-3 font-bold text-teal-400">
                          ₹{(item.addedPrice / 100).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-white">Neural Total:</span>
                    <span className="text-xl font-bold text-teal-400">
                      ₹{(state.cart.reduce((sum, item) => sum + item.addedPrice, 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <button className="relative w-full overflow-hidden border-none rounded-xl font-['Sora'] font-semibold text-base px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    🚀 Checkout with AI Verification
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Demo Panel - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {!state.selectedProduct ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center hover:bg-white/8 transition-all duration-300">
                <div className="mb-6">
                  <span className="text-6xl opacity-50">🎯</span>
                </div>
                <h2 className="text-2xl font-bold mb-4 font-['Sora'] text-white">AI Product Analysis</h2>
                <p className="opacity-80 max-w-md mx-auto leading-relaxed text-slate-300">
                  Select a product from the intelligence catalog to begin neural network consistency analysis
                </p>
              </div>
            ) : (
              <div>
                {/* AI Product Intelligence Display */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6 hover:bg-white/8 transition-all duration-300">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl">
                        📱
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2 font-['Sora'] text-white">{state.selectedProduct.name}</h2>
                      <p className="opacity-80 mb-4 text-slate-300">{state.selectedProduct.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg text-center">
                          <div className="opacity-60 mb-1 text-slate-400">Brand</div>
                          <div className="font-semibold text-white">{state.selectedProduct.brand}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg text-center">
                          <div className="opacity-60 mb-1 text-slate-400">Category</div>
                          <div className="font-semibold text-white">{state.selectedProduct.category}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg text-center">
                          <div className="opacity-60 mb-1 text-slate-400">Stock</div>
                          <div className="font-semibold text-white">{state.selectedProduct.inventory} units</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-lg text-center">
                          <div className="opacity-60 mb-1 text-slate-400">Neural Price</div>
                          <div className="text-sm font-bold text-teal-400">
                            ₹{(state.selectedProduct.price / 100).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {state.lastFetchMode && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <button 
                        onClick={addToCart}
                        className="relative overflow-hidden border-none rounded-xl font-['Sora'] font-semibold text-base px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer w-full md:w-auto"
                      >
                        🛒 Add to Neural Cart • ₹{(state.selectedProduct.price / 100).toLocaleString()}
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Consistency Models */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/8 transition-all duration-300">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3 font-['Sora'] text-white">
                    <span className="text-2xl">⚡</span>
                    Neural Consistency Models
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Neural Fresh Data */}
                    <div className="text-center">
                      <button
                        onClick={handleAlwaysFresh}
                        disabled={state.isLoading}
                        className="relative w-full overflow-hidden border-none rounded-xl font-['Sora'] font-semibold text-base px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                      >
                        {state.isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">🧠</span>
                            Neural Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span>🎯</span>
                            Always Fresh
                          </span>
                        )}
                      </button>
                      <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-sm text-white">Neural Authority</h4>
                        <p className="text-xs opacity-80 leading-relaxed text-slate-300">
                          Direct database query with guaranteed accuracy. Higher latency for absolute precision.
                        </p>
                      </div>
                    </div>

                    {/* Neural Fast Cache */}
                    <div className="text-center">
                      <button
                        onClick={handleCheckFast}
                        disabled={state.isLoading}
                        className="relative w-full overflow-hidden border-none rounded-xl font-['Sora'] font-semibold text-base px-6 py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                      >
                        {state.isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-pulse">⚡</span>
                            Cache Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span>🚀</span>
                            Check Fast
                          </span>
                        )}
                      </button>
                      <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-sm text-white">Neural Cache</h4>
                        <p className="text-xs opacity-80 leading-relaxed text-slate-300">
                          TTL-based caching for lightning speed. Possible staleness within time window.
                        </p>
                      </div>
                    </div>

                    {/* Neural Smart Memory */}
                    <div className="text-center">
                      <button
                        onClick={handleSmartMemory}
                        disabled={state.isLoading}
                        className="relative w-full overflow-hidden border-none rounded-xl font-['Sora'] font-semibold text-base px-6 py-4 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                      >
                        {state.isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-bounce">🤖</span>
                            AI Optimizing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span>🧠</span>
                            Smart Memory
                          </span>
                        )}
                      </button>
                      <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-sm text-white">Neural Intelligence</h4>
                        <p className="text-xs opacity-80 leading-relaxed text-slate-300">
                          LRU caching with AI-powered eviction. Balanced speed and accuracy for optimal performance.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {state.isLoading && (
                    <div className="mt-6 text-center">
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-full inline-block mb-4 animate-pulse">
                        <span className="text-2xl">🧠</span>
                      </div>
                      <p className="opacity-80 text-slate-300">Neural networks processing...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {state.selectedProduct && state.requestMetadata && (
          <Card title="Results & Performance Metrics">
            {/* Error Display */}
            {state.error && (
              <Alert type="error" title="Request Failed" onDismiss={clearResults} className="mb-6">
                {state.error}
              </Alert>
            )}

            {/* Performance Metrics */}
            {state.requestMetadata && (
              <div className="mb-6 space-y-4">
                {/* Basic Request Metadata */}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    Request Metadata
                    {state.cacheMetrics?.status && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        state.cacheMetrics.status === 'HIT' ? 'bg-green-600' :
                        state.cacheMetrics.status === 'MISS' ? 'bg-orange-600' :
                        state.cacheMetrics.status === 'EVICTED' ? 'bg-red-600' :
                        'bg-gray-600'
                      }`}>
                        {state.cacheMetrics.status}
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Request ID:</span>
                      <br />
                      <code className="text-blue-300">{state.requestMetadata.requestId}</code>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Duration:</span>
                      <br />
                      <span className="text-green-400 font-mono">
                        {state.requestMetadata.duration?.toFixed(2)}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Timestamp:</span>
                      <br />
                      <span className="text-gray-300">
                        {state.requestMetadata.timestamp 
                          ? new Date(state.requestMetadata.timestamp).toLocaleTimeString()
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cache Performance Metrics */}
                {state.cacheMetrics && (
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                    <h4 className="font-semibold mb-3 text-blue-400">Cache Performance</h4>
                    
                    {/* Cache Policy & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                      {state.cacheMetrics.policy && (
                        <div>
                          <span className="text-gray-400">Cache Policy:</span>
                          <br />
                          <span className="text-purple-400 font-semibold">
                            {state.cacheMetrics.policy}
                          </span>
                        </div>
                      )}
                      {state.cacheMetrics.fromCache && (
                        <div>
                          <span className="text-gray-400">From Cache:</span>
                          <br />
                          <span className={`font-semibold ${
                            state.cacheMetrics.fromCache === 'true' ? 'text-green-400' : 'text-orange-400'
                          }`}>
                            {state.cacheMetrics.fromCache === 'true' ? 'Yes' : 'No'}
                          </span>
                        </div>
                      )}
                      {state.cacheMetrics.age && (
                        <div>
                          <span className="text-gray-400">Cache Age:</span>
                          <br />
                          <span className="text-yellow-400 font-mono">{state.cacheMetrics.age}</span>
                        </div>
                      )}
                      {state.cacheMetrics.efficiency && (
                        <div>
                          <span className="text-gray-400">Efficiency:</span>
                          <br />
                          <span className={`font-semibold ${
                            state.cacheMetrics.efficiency === 'optimal' ? 'text-green-400' :
                            state.cacheMetrics.efficiency === 'warming' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`}>
                            {state.cacheMetrics.efficiency}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timing Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      {state.cacheMetrics.responseTime && (
                        <div>
                          <span className="text-gray-400">Response Time:</span>
                          <br />
                          <span className="text-green-400 font-mono">{state.cacheMetrics.responseTime}</span>
                        </div>
                      )}
                      {state.cacheMetrics.cacheCheckTime && (
                        <div>
                          <span className="text-gray-400">Cache Check:</span>
                          <br />
                          <span className="text-blue-400 font-mono">{state.cacheMetrics.cacheCheckTime}</span>
                        </div>
                      )}
                      {state.cacheMetrics.dbTime && (
                        <div>
                          <span className="text-gray-400">Database Time:</span>
                          <br />
                          <span className="text-orange-400 font-mono">{state.cacheMetrics.dbTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Cache Statistics (for LRU/TTL) */}
                    {(state.cacheMetrics.hitRate || state.cacheMetrics.size || state.cacheMetrics.memoryUsage) && (
                      <div className="pt-3 border-t border-gray-600">
                        <h5 className="font-medium mb-2 text-gray-300">Cache Statistics</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {state.cacheMetrics.hitRate && (
                            <div>
                              <span className="text-gray-400">Hit Rate:</span>
                              <br />
                              <span className="text-green-400 font-mono font-semibold">
                                {state.cacheMetrics.hitRate}
                              </span>
                            </div>
                          )}
                          {state.cacheMetrics.size && (
                            <div>
                              <span className="text-gray-400">Cache Size:</span>
                              <br />
                              <span className="text-blue-400 font-mono">{state.cacheMetrics.size} items</span>
                            </div>
                          )}
                          {state.cacheMetrics.memoryUsage && (
                            <div>
                              <span className="text-gray-400">Memory Usage:</span>
                              <br />
                              <span className="text-purple-400 font-mono">{state.cacheMetrics.memoryUsage}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Priority (for LRU) */}
                    {state.cacheMetrics.priority && (
                      <div className="pt-3 border-t border-gray-600">
                        <div className="text-sm">
                          <span className="text-gray-400">Cache Priority:</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${
                            state.cacheMetrics.priority === 'high' ? 'bg-red-600' :
                            state.cacheMetrics.priority === 'normal' ? 'bg-blue-600' :
                            'bg-gray-600'
                          }`}>
                            {state.cacheMetrics.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Data Display */}
            {state.data && state.data.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">
                    Products ({state.data.length} items)
                  </h4>
                  <Button size="sm" variant="secondary" onClick={clearResults}>
                    Clear Results
                  </Button>
                </div>
                
                {/* Responsive Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Price</th>
                        <th className="text-left py-2 px-3">Category</th>
                        <th className="text-left py-2 px-3">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.map((product) => (
                        <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="py-2 px-3 font-medium">{product.name}</td>
                          <td className="py-2 px-3 text-green-400 font-mono">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-gray-300">{product.category}</td>
                          <td className="py-2 px-3 text-gray-400">
                            {new Date(product.updated_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : state.data && state.data.length === 0 ? (
              <Alert type="info" title="No Data">
                No products found. This might indicate an empty database or filtered results.
              </Alert>
            ) : !state.isLoading && !state.error ? (
              <div className="text-center text-gray-400 py-8">
                <p>Select a consistency model above to fetch data and see performance metrics.</p>
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </main>
  );
}

/**
 * Main page component with error boundary
 */
export default function Home() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

