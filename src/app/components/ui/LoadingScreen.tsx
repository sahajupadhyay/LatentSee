'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, Database, BarChart3 } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
  variant?: 'home' | 'analytics' | 'docs' | 'auth';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  onComplete, 
  variant = 'home' 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = {
    home: [
      { icon: Brain, text: 'Initializing Neural Networks...', color: '#6C63FF' },
      { icon: Database, text: 'Loading Cache Systems...', color: '#00C6AE' },
      { icon: Zap, text: 'Optimizing Performance...', color: '#EF4444' },
      { icon: BarChart3, text: 'Preparing Insights...', color: '#F59E0B' }
    ],
    analytics: [
      { icon: BarChart3, text: 'Loading Analytics Engine...', color: '#00C6AE' },
      { icon: Database, text: 'Fetching Performance Data...', color: '#6C63FF' },
      { icon: Brain, text: 'Processing Metrics...', color: '#EF4444' },
      { icon: Zap, text: 'Ready to Explore...', color: '#F59E0B' }
    ],
    docs: [
      { icon: Brain, text: 'Loading Documentation...', color: '#6C63FF' },
      { icon: Database, text: 'Indexing Content...', color: '#00C6AE' },
      { icon: Zap, text: 'Preparing Examples...', color: '#EF4444' },
      { icon: BarChart3, text: 'Ready to Learn...', color: '#F59E0B' }
    ],
    auth: [
      { icon: Zap, text: 'Securing Connection...', color: '#EF4444' },
      { icon: Database, text: 'Verifying Credentials...', color: '#00C6AE' },
      { icon: Brain, text: 'Authenticating...', color: '#6C63FF' },
      { icon: BarChart3, text: 'Welcome Back...', color: '#F59E0B' }
    ]
  };

  const steps = loadingSteps[variant];
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isLoading) return;

    let progressValue = 0;
    let stepIndex = 0;
    
    const progressInterval = setInterval(() => {
      progressValue += 8; // Fixed increment instead of random
      setProgress(progressValue);
      
      if (progressValue >= 100) {
        clearInterval(progressInterval);
        clearInterval(stepInterval);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 300);
      }
    }, 200);

    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setCurrentStep(stepIndex);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isLoading, variant, onComplete, steps.length]);  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ 
          opacity: 0, 
          scale: 0.98,
          filter: "blur(4px)"
        }}
        transition={{ 
          duration: 0.5,
          ease: "easeInOut"
        }}
        className="fixed inset-0 z-50 bg-primary-950 flex items-center justify-center"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => {
            // Static positions that are consistent between server and client
            const startX = 50 + (i * 80) % 1400;
            const startY = 50 + (i * 60) % 800;
            const endX = startX + (i % 2 ? 100 : -100);
            const endY = startY + (i % 3 ? 80 : -80);
            
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-accent-400/20 rounded-full"
                initial={{
                  x: startX,
                  y: startY,
                  scale: 0
                }}
                animate={{
                  x: endX,
                  y: endY,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2.5 + (i % 3),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1
                }}
              />
            );
          })}
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-md px-6">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-heading font-bold text-white mb-2">
              LatentSee
            </h1>
            <p className="text-neutral-400 text-sm">
              AI-Powered E-commerce Insights
            </p>
          </motion.div>

          {/* Current Step Icon */}
          <motion.div
            key={currentStep}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="relative"
          >
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto relative"
              style={{ 
                background: `radial-gradient(circle, ${currentStepData.color}20, transparent)`,
                border: `2px solid ${currentStepData.color}40`
              }}
            >
              <currentStepData.icon 
                className="w-8 h-8"
                style={{ color: currentStepData.color }}
              />
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${currentStepData.color}` }}
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

          {/* Loading Text */}
          <motion.div
            key={currentStepData.text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <p 
              className="text-lg font-medium"
              style={{ color: currentStepData.color }}
            >
              {currentStepData.text}
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="w-full bg-primary-800/50 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-500 to-secondary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-400">
                {Math.floor(Math.min(progress, 100))}%
              </span>
              <span className="text-neutral-400">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-accent-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen;