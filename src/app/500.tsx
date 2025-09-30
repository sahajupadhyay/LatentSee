'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ServerCrash, RefreshCw, Home, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BorderMagicButton } from '@/app/components/ui';

interface ServerErrorProps {
  statusCode?: number;
  title?: string;
  description?: string;
}

export default function ServerError({ 
  statusCode = 500,
  title = "Internal Server Error",
  description = "Our servers are experiencing some technical difficulties. Our team has been notified and is working to resolve the issue."
}: ServerErrorProps) {

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    // Try to navigate to the same page again
    window.location.href = window.location.href;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="relative max-w-lg w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-orange-400/20 rounded-full"
              initial={{
                x: Math.random() * 500,
                y: Math.random() * 700,
                scale: 0
              }}
              animate={{
                x: Math.random() * 500,
                y: Math.random() * 700,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3.5 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.25
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
          {/* Server Error Icon */}
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
            <div className="w-20 h-20 rounded-full bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center mx-auto relative">
              <ServerCrash className="w-10 h-10 text-orange-400" />
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-orange-400"
                animate={{ 
                  scale: [1, 1.2, 1],
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
            {/* Status Code */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <h1 className="text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                {statusCode}
              </h1>
            </motion.div>
            
            <h2 className="text-2xl font-heading font-bold text-white">
              {title}
            </h2>
            
            <p className="text-slate-300 leading-relaxed">
              {description}
            </p>

            {/* Status Information */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-600"
            >
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Server Status</span>
              </div>
              <div className="text-left text-sm text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Status Code:</span>
                  <span className="text-orange-300">{statusCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="text-slate-400">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Request ID:</span>
                  <span className="text-slate-400 font-mono text-xs">
                    {Math.random().toString(36).substr(2, 9)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            {/* Primary Actions */}
            <div className="flex gap-3 justify-center">
              <BorderMagicButton
                onClick={handleRetry}
                className="flex-1 max-w-[140px]"
                primaryColor="#F97316"
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
                  Dashboard
                </BorderMagicButton>
              </Link>
            </div>

            {/* Secondary Actions */}
            <div className="space-y-2">
              <motion.button
                onClick={handleRefresh}
                className="text-sm text-slate-400 hover:text-orange-300 transition-colors flex items-center justify-center gap-1"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <RefreshCw className="w-3 h-3" />
                Refresh page
              </motion.button>

              <motion.button
                onClick={() => window.history.back()}
                className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                whileHover={{ x: -2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ArrowLeft className="w-3 h-3" />
                Go back
              </motion.button>
            </div>
          </motion.div>

          {/* Help Information */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 pt-4 border-t border-slate-700"
          >
            <p className="text-xs text-slate-500 mb-2">
              If this problem persists, please contact our support team.
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <a 
                href="mailto:support@latentsee.com" 
                className="text-slate-400 hover:text-orange-300 transition-colors"
              >
                Email Support
              </a>
              <a 
                href="/docs" 
                className="text-slate-400 hover:text-orange-300 transition-colors"
              >
                Documentation
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* LatentSee Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
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

// Export a function to render specific server errors
export function renderServerError(statusCode: number) {
  const errorConfig = {
    500: {
      title: "Internal Server Error",
      description: "Our servers encountered an unexpected condition that prevented it from fulfilling your request. Our engineering team has been automatically notified."
    },
    502: {
      title: "Bad Gateway",
      description: "We're having trouble connecting to our services. This is usually temporary and should resolve shortly."
    },
    503: {
      title: "Service Unavailable",
      description: "Our services are temporarily unavailable due to maintenance or high traffic. Please try again in a few moments."
    },
    504: {
      title: "Gateway Timeout",
      description: "The request took longer than expected to process. Our services might be experiencing high load."
    }
  };

  const config = errorConfig[statusCode as keyof typeof errorConfig] || errorConfig[500];
  
  return (
    <ServerError 
      statusCode={statusCode}
      title={config.title}
      description={config.description}
    />
  );
}