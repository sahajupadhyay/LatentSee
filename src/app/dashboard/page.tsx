'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Activity } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ProtectedRoute, AuthStatusBadge } from '@/app/components/auth';
import { Squares } from '@/app/components/ui';
import ExecutionPage from '@/app/components/pages/ExecutionPage';

/**
 * Dashboard Page
 * 
 * Protected dashboard page that demonstrates the authentication system
 * and serves as the main hub for authenticated users.
 */

function DashboardContent() {
  const { user, signOut, isLoading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect will be handled by AuthProvider
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary-950 relative overflow-hidden">
      {/* Dev Auth Status Badge */}
      <AuthStatusBadge />
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        <Squares 
          speed={0.3} 
          squareSize={60}
          direction="diagonal"
          borderColor="rgba(100, 116, 139, 0.1)"
          hoverFillColor="rgba(100, 116, 139, 0.05)"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-primary-700/30 bg-primary-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Welcome */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">
                  Welcome back, {user?.profile?.firstName || user?.email}
                </h1>
                <p className="text-sm text-neutral-400">
                  Neural Dashboard • {new Date().toLocaleDateString()}
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Activity className="w-4 h-4 text-green-400" />
                Online
              </div>
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 
                         hover:text-white bg-primary-800/50 hover:bg-primary-700/50 
                         rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* User Info Card */}
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-accent-400" />
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">Email:</span>
                <span className="ml-2 text-white">{user?.email}</span>
              </div>
              <div>
                <span className="text-neutral-400">Verified:</span>
                <span className={`ml-2 ${user?.emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {user?.emailVerified ? 'Yes' : 'Pending'}
                </span>
              </div>
              {user?.profile?.firstName && (
                <div>
                  <span className="text-neutral-400">Name:</span>
                  <span className="ml-2 text-white">
                    {user.profile.firstName} {user.profile.lastName}
                  </span>
                </div>
              )}
              <div>
                <span className="text-neutral-400">Account ID:</span>
                <span className="ml-2 text-neutral-300 font-mono text-xs">
                  {user?.id}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Neural Consistency Models */}
        <ExecutionPage />
      </div>
    </div>
  );
}

/**
 * Dashboard Page with Route Protection
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}