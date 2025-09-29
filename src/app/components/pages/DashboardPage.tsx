'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Squares, TopNav, LoadingScreen } from '@/app/components/ui';
import ExecutionPage from './ExecutionPage';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  
  // Create a ref for the execution section
  const executionSectionRef = useRef<HTMLDivElement>(null);
  
  // Scroll function for the Get Started button
  const scrollToExecution = () => {
    executionSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };
  
  // Navigate to auth page for Learn More
  const handleLearnMore = () => {
    router.push('/auth/signup?redirect=/dashboard&message=Create an account to explore LatentSee features');
  };

  // Handle loading completion
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => setShowContent(true), 100);
  }, []);

  // Auto-complete loading after a minimum time (for realism)
  useEffect(() => {
    const minLoadingTime = setTimeout(() => {
      if (isLoading) {
        handleLoadingComplete();
      }
    }, 2500); // Minimum 2.5 seconds for the full experience

    return () => clearTimeout(minLoadingTime);
  }, [isLoading]);

  return (
    <>
      <LoadingScreen 
        isLoading={isLoading} 
        onComplete={handleLoadingComplete}
        variant="home"
      />
      
      {showContent && (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        ease: "easeOut",
        staggerChildren: 0.1
      }}
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
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-20">
        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold text-white max-w-3xl mb-12"
        >
          How cloud systems balance speed versus correctness in e-commerce
        </motion.h1>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={scrollToExecution}
            className="px-8 py-3 bg-gradient-to-r from-white to-gray-100 hover:from-gray-50 hover:to-gray-200 text-black font-medium rounded-full transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl border border-white/20"
          >
            Get Started
          </button>
          <button 
            onClick={handleLearnMore}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full border border-white/20 backdrop-blur-sm transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
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
      )}
    </>
  );
}