'use client';

import { useEffect } from 'react';
import { authService } from '@/lib/auth/service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-test');

export default function AuthTestPage() {
  useEffect(() => {
    const testAuthService = async () => {
      logger.info('Testing auth service configuration');
      
      // Test basic config
      logger.info('Environment variables:', {
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'missing'
      });
      
      // Test direct Supabase connection
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const client = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await client.auth.getUser();
        
        logger.info('Direct Supabase test completed', {
          hasData: Boolean(data),
          hasUser: Boolean(data?.user),
          hasError: Boolean(error),
          errorMessage: error?.message || 'none'
        });
      } catch (error) {
        logger.error('Direct Supabase test failed', error as Error);
      }
      
      // Test auth service status
      try {
        const user = await authService.getCurrentUser();
        logger.info('Auth service test completed', {
          hasUser: Boolean(user),
          userEmail: user?.email || 'no-user'
        });
      } catch (error) {
        logger.error('Auth service test failed', error as Error);
      }
    };
    
    testAuthService();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Service Test</h1>
      <p>Check the browser console and server logs for auth service status.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">Environment Status:</h2>
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}</p>
        <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}</p>
      </div>
    </div>
  );
}