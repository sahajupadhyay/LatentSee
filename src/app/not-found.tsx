'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, Home, Search, ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';
import { BorderMagicButton } from '@/app/components/ui';

export default function NotFound() {
  const suggestions = [
    { icon: Home, label: 'Dashboard', href: '/', desc: 'View performance analytics' },
    { icon: Search, label: 'API Docs', href: '/docs', desc: 'Explore API documentation' },
    { icon: Compass, label: 'Analytics', href: '/analytics', desc: 'Deep dive into metrics' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="relative max-w-lg w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/20 rounded-full"
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
                duration: 4 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3
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
          {/* 404 Icon */}
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
            <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center mx-auto relative">
              <FileQuestion className="w-10 h-10 text-purple-400" />
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-400"
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

          {/* 404 Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 space-y-4"
          >
            {/* Large 404 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <h1 className="text-6xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                404
              </h1>
            </motion.div>
            
            <h2 className="text-2xl font-heading font-bold text-white">
              Page Not Found
            </h2>
            
            <p className="text-slate-300 leading-relaxed">
              The page you&apos;re looking for seems to have wandered off into the digital void. 
              Don&apos;t worry - even in distributed systems, some requests get lost!
            </p>
          </motion.div>

          {/* Quick Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-4">
              Try one of these instead:
            </h3>
            
            <div className="space-y-2">
              {suggestions.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="block p-3 rounded-lg bg-slate-800/50 border border-slate-600/50 hover:border-slate-500 transition-all group hover:bg-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                        <item.icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Link href="/" className="block">
              <BorderMagicButton
                className="w-full"
                primaryColor="#A855F7"
              >
                <Home className="w-4 h-4 mr-2" />
                Take Me Home
              </BorderMagicButton>
            </Link>

            <motion.button
              onClick={() => window.history.back()}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
              whileHover={{ x: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ArrowLeft className="w-3 h-3" />
              Go back to previous page
            </motion.button>
          </motion.div>

          {/* Fun Fact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 pt-4 border-t border-slate-700"
          >
            <p className="text-xs text-slate-500">
              💡 Fun fact: In distributed systems, 404s help identify broken links and improve system reliability!
            </p>
          </motion.div>
        </motion.div>

        {/* LatentSee Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-6"
        >
          <Link 
            href="/"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to LatentSee Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}