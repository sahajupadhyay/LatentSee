'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Squares, TopNav } from '@/app/components/ui';
import ExecutionPage from './ExecutionPage';

export default function DashboardPage() {
  // Create a ref for the execution section
  const executionSectionRef = useRef<HTMLDivElement>(null);
  
  // Scroll function for the Get Started button
  const scrollToExecution = () => {
    executionSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-primary-950 relative overflow-hidden"
    >
      {/* Top Navigation */}
      <TopNav />
      
      {/* Animated Squares Background */}
      <div className="absolute inset-0">
        <Squares 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(100, 116, 139, 0.2)"
          hoverFillColor="rgba(100, 116, 139, 0.1)"
        />
      </div>
      
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-3xl md:text-5xl font-bold text-white max-w-3xl mb-12"
        >
          How cloud systems balance speed versus correctness in e-commerce
        </motion.h1>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={scrollToExecution}
            className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Get Started
          </button>
          <button className="px-8 py-3 bg-white/10 text-white font-medium rounded-full border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
            Learn More
          </button>
        </div>
      </section>
      
      {/* Execution Page Section */}
      <div 
        ref={executionSectionRef} 
        className="relative z-10"
        id="execution-section"
      >
        <ExecutionPage />
      </div>
    </motion.div>
  );
}