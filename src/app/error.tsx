'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BorderMagicButton } from '@/app/components/ui';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to monitoring service
    console.error('Global Error Boundary:', error);
    
    // In production, you would send this to your monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Analytics.track('error', { message: error.message, stack: error.stack });
    }
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="relative max-w-md w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-red-400/20 rounded-full"
              initial={{
                x: Math.random() * 400,
                y: Math.random() * 600,
                scale: 0
              }}
              animate={{
                x: Math.random() * 400,
                y: Math.random() * 600,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="mb-6"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto relative">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-400"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 0.2, 0.7]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>

          {/* Error Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 space-y-4"
          >
            <h1 className="text-2xl font-heading font-bold text-white">
              Oops! Something went wrong
            </h1>
            
            <p className="text-slate-300 leading-relaxed">
              We encountered an unexpected error while processing your request. 
              Our team has been notified and is working to fix the issue.
            </p>

            {/* Development Error Details */}
            {isDevelopment && (
              <motion.details 
                className="mt-4 text-left bg-slate-900/50 rounded-lg p-4 border border-slate-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <summary className="cursor-pointer text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Development Error Details
                </summary>
                <div className="text-xs text-red-300 font-mono break-all bg-slate-900/70 p-3 rounded border-l-2 border-red-400">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div className="mb-2">
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.details>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <div className="flex gap-3 justify-center">
              <BorderMagicButton
                onClick={reset}
                className="flex-1 max-w-[140px]"
                primaryColor="#EF4444"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </BorderMagicButton>

              <Link href="/" className="flex-1 max-w-[140px]">
                <BorderMagicButton
                  className="w-full"
                  primaryColor="#00C6AE"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </BorderMagicButton>
              </Link>
            </div>

            <motion.button
              onClick={() => window.history.back()}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
              whileHover={{ x: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ArrowLeft className="w-3 h-3" />
              Go back
            </motion.button>
          </motion.div>

          {/* Error ID for Support */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-4 border-t border-slate-700"
          >
            <p className="text-xs text-slate-500">
              Error ID: {error.digest || Date.now().toString(36)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              If this problem persists, please contact support with the error ID above.
            </p>
          </motion.div>
        </motion.div>

        {/* LatentSee Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <Link 
            href="/"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to LatentSee
          </Link>
        </motion.div>
      </div>
    </div>
  );
}