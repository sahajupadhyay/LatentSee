'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Zap, 
  Database, 
  BarChart3, 
  Shield, 
  Code2, 
  Globe,
  ChevronRight,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

import { Squares } from '@/app/components/ui';

/**
 * Documentation Page
 * 
 * Comprehensive documentation for LatentSee platform covering:
 * - Platform overview and concepts
 * - Feature explanations
 * - Usage examples
 * - API documentation
 * - Best practices
 */

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Handle section navigation
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // Copy code to clipboard
  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Code block component
  const CodeBlock = ({ code, language = 'javascript', id }: { code: string; language?: string; id: string }) => (
    <div className="relative bg-primary-900/50 border border-primary-700/30 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary-700/30">
        <span className="text-xs text-neutral-400 font-medium">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
        >
          {copiedCode === id ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm text-neutral-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  // Feature card component
  const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="bg-primary-900/30 border border-primary-700/30 rounded-lg p-6 hover:border-primary-600/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-accent-400">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-neutral-300 text-sm leading-relaxed">{description}</p>
    </div>
  );

  const sections: DocSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to LatentSee</h2>
            <p className="text-lg text-neutral-300 leading-relaxed mb-6">
              LatentSee is a cutting-edge platform that visualizes and analyzes how cloud systems balance 
              speed versus correctness in e-commerce environments. Our platform provides real-time insights 
              into neural consistency patterns, caching performance, and system reliability.
            </p>
            <div className="bg-accent-500/10 border border-accent-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-accent-400 mb-2">Core Mission</h3>
              <p className="text-neutral-300">
                To help developers and system architects understand the complex trade-offs between 
                performance and data consistency in distributed e-commerce systems through 
                interactive visualizations and real-time analytics.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Real-time Analysis"
              description="Monitor system performance and consistency metrics in real-time with advanced neural pattern recognition."
            />
            <FeatureCard
              icon={<Database className="w-6 h-6" />}
              title="Smart Caching"
              description="Intelligent caching strategies that adapt to your e-commerce traffic patterns and data consistency requirements."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Performance Metrics"
              description="Comprehensive analytics dashboard showing detailed performance metrics and system health indicators."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Reliability Tracking"
              description="Advanced reliability monitoring with predictive analysis for system failures and bottlenecks."
            />
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Features',
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Platform Features</h2>
            <p className="text-lg text-neutral-300 mb-8">
              Explore the powerful features that make LatentSee the premier choice for 
              e-commerce system analysis and optimization.
            </p>
          </div>

          <div className="space-y-8">
            {/* Neural Consistency Analysis */}
            <div className="border border-primary-700/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-accent-400" />
                Neural Consistency Analysis
              </h3>
              <p className="text-neutral-300 mb-4">
                Advanced AI-powered analysis that detects consistency patterns across your distributed systems.
              </p>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Real-time consistency violation detection
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Automated pattern recognition for data anomalies
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Predictive analysis for potential consistency issues
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Cross-service dependency mapping
                </li>
              </ul>
            </div>

            {/* Performance Optimization */}
            <div className="border border-primary-700/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-400" />
                Performance Optimization
              </h3>
              <p className="text-neutral-300 mb-4">
                Intelligent performance tuning recommendations based on your system's unique characteristics.
              </p>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Adaptive caching strategy recommendations
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Load balancing optimization suggestions
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Database query optimization insights
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Resource allocation recommendations
                </li>
              </ul>
            </div>

            {/* Interactive Dashboard */}
            <div className="border border-primary-700/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-400" />
                Interactive Dashboard
              </h3>
              <p className="text-neutral-300 mb-4">
                Comprehensive visualization tools for understanding system behavior and performance trends.
              </p>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Real-time performance graphs and charts
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Customizable metric dashboards
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Historical trend analysis
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-accent-400" />
                  Alert and notification system
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Code2 className="w-5 h-5" />,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Getting Started</h2>
            <p className="text-lg text-neutral-300 mb-8">
              Get up and running with LatentSee in just a few simple steps.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-accent-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">Step 1: Create Your Account</h3>
              <p className="text-neutral-300 mb-4">
                Sign up for a LatentSee account to access our platform and start monitoring your systems.
              </p>
              <Link 
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:shadow-xl border border-accent-400/20"
              >
                Create Account
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="border-l-4 border-accent-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">Step 2: Configure Your Environment</h3>
              <p className="text-neutral-300 mb-4">
                Set up environment variables and configure your system for optimal monitoring.
              </p>
              <CodeBlock
                id="env-config"
                language="bash"
                code={`# Environment Configuration
export LATENTSEE_API_KEY="your-api-key-here"
export LATENTSEE_ENVIRONMENT="production"
export LATENTSEE_ENDPOINTS="https://api.latentsee.com"`}
              />
            </div>

            <div className="border-l-4 border-accent-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">Step 3: Install SDK</h3>
              <p className="text-neutral-300 mb-4">
                Install our SDK to start collecting metrics from your application.
              </p>
              <CodeBlock
                id="sdk-install"
                language="bash"
                code={`# Install via npm
npm install @latentsee/sdk

# Or via yarn
yarn add @latentsee/sdk`}
              />
            </div>

            <div className="border-l-4 border-accent-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">Step 4: Initialize Monitoring</h3>
              <p className="text-neutral-300 mb-4">
                Initialize the LatentSee SDK in your application.
              </p>
              <CodeBlock
                id="sdk-init"
                language="javascript"
                code={`import { LatentSee } from '@latentsee/sdk';

// Initialize LatentSee
const latentSee = new LatentSee({
  apiKey: process.env.LATENTSEE_API_KEY,
  environment: process.env.LATENTSEE_ENVIRONMENT,
  options: {
    realTimeUpdates: true,
    performanceTracking: true,
    consistencyMonitoring: true
  }
});

// Start monitoring
latentSee.startMonitoring();`}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: <Globe className="w-5 h-5" />,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">API Reference</h2>
            <p className="text-lg text-neutral-300 mb-8">
              Complete reference for LatentSee APIs and SDK methods.
            </p>
          </div>

          <div className="space-y-8">
            {/* Authentication */}
            <div className="border border-primary-700/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Authentication</h3>
              <p className="text-neutral-300 mb-4">
                All API requests require authentication using your API key.
              </p>
              <CodeBlock
                id="auth-example"
                language="javascript"
                code={`// Authentication Header
const headers = {
  'Authorization': 'Bearer your-api-key-here',
  'Content-Type': 'application/json'
};

// Example request
fetch('https://api.latentsee.com/v1/metrics', {
  method: 'GET',
  headers: headers
});`}
              />
            </div>

            {/* Core Methods */}
            <div className="border border-primary-700/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Core Methods</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">trackEvent()</h4>
                  <p className="text-sm text-neutral-400 mb-3">Track custom events in your application.</p>
                  <CodeBlock
                    id="track-event"
                    language="javascript"
                    code={`latentSee.trackEvent('user_action', {
  action: 'purchase',
  userId: 'user123',
  amount: 99.99,
  timestamp: Date.now()
});`}
                  />
                </div>

                <div>
                  <h4 className="text-lg font-medium text-white mb-2">trackPerformance()</h4>
                  <p className="text-sm text-neutral-400 mb-3">Monitor performance metrics for specific operations.</p>
                  <CodeBlock
                    id="track-performance"
                    language="javascript"
                    code={`const timer = latentSee.startTimer('database_query');

// Your database operation
const result = await db.query('SELECT * FROM products');

timer.end({
  operation: 'product_fetch',
  recordCount: result.length
});`}
                  />
                </div>

                <div>
                  <h4 className="text-lg font-medium text-white mb-2">checkConsistency()</h4>
                  <p className="text-sm text-neutral-400 mb-3">Validate data consistency across services.</p>
                  <CodeBlock
                    id="check-consistency"
                    language="javascript"
                    code={`const consistencyCheck = await latentSee.checkConsistency({
  services: ['user-service', 'order-service'],
  entity: 'user',
  entityId: 'user123',
  fields: ['email', 'name', 'preferences']
});

if (!consistencyCheck.isConsistent) {
  console.log('Consistency violations:', consistencyCheck.violations);
}`}
                  />
                </div>
              </div>
            </div>

            {/* Response Formats */}
            <div className="border border-primary-700/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Response Formats</h3>
              <p className="text-neutral-300 mb-4">
                All API responses follow a consistent format:
              </p>
              <CodeBlock
                id="response-format"
                language="json"
                code={`{
  "success": true,
  "data": {
    "metrics": [...],
    "timestamp": "2025-09-29T10:30:00Z"
  },
  "meta": {
    "requestId": "req_123456",
    "processingTime": 150,
    "rateLimit": {
      "remaining": 999,
      "resetTime": "2025-09-29T11:00:00Z"
    }
  }
}`}
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-primary-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <Squares 
          speed={0.2} 
          squareSize={80}
          direction="diagonal"
          borderColor="rgba(100, 116, 139, 0.05)"
          hoverFillColor="rgba(100, 116, 139, 0.02)"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-primary-700/30 bg-primary-950/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
                <div className="w-px h-6 bg-primary-700"></div>
                <h1 className="text-2xl font-bold text-white">Documentation</h1>
              </div>
              <Link 
                href="/auth/signup"
                className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:shadow-xl border border-accent-400/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-8 space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                        : 'text-neutral-400 hover:text-neutral-300 hover:bg-primary-800/30'
                    }`}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="space-y-16">
                {sections.map((section) => (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="scroll-mt-8"
                  >
                    {section.content}
                  </motion.section>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-primary-700/30 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-neutral-400 mb-4">
                Need more help? Contact our support team or join our community.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link 
                  href="/support"
                  className="text-accent-400 hover:text-accent-300 transition-colors"
                >
                  Support
                </Link>
                <div className="w-px h-4 bg-primary-700"></div>
                <Link 
                  href="/community"
                  className="text-accent-400 hover:text-accent-300 transition-colors"
                >
                  Community
                </Link>
                <div className="w-px h-4 bg-primary-700"></div>
                <Link 
                  href="/changelog"
                  className="text-accent-400 hover:text-accent-300 transition-colors"
                >
                  Changelog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;