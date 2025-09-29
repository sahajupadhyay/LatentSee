import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Authentication Callback Route Handler
 * 
 * Simplified callback handler for development.
 * In production, you'll want to implement proper code exchange.
 */

export async function GET(request: NextRequest) {
  const requestId = uuidv4();
  const logger = createLogger(requestId);
  
  try {
    const requestUrl = new URL(request.url);
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    const next = requestUrl.searchParams.get('next') || '/dashboard';

    logger.info('Processing auth callback', {
      hasError: Boolean(error),
      redirectTo: next,
      origin: requestUrl.origin
    });

    // Handle OAuth errors
    if (error) {
      logger.error('OAuth error in callback', new Error(errorDescription || error), {
        error,
        errorDescription
      });

      const errorUrl = new URL('/auth/login', requestUrl.origin);
      errorUrl.searchParams.set('error', error);
      errorUrl.searchParams.set('message', errorDescription || 'Authentication failed');
      
      return NextResponse.redirect(errorUrl.toString());
    }

    // For development - just redirect to success page
    // In production, implement proper Supabase code exchange here
    
    logger.info('Authentication callback completed');

    // Determine redirect URL
    let redirectUrl: string;
    try {
      // Validate redirect URL to prevent open redirect attacks
      const redirectTarget = new URL(next, requestUrl.origin);
      
      // Only allow same-origin redirects
      if (redirectTarget.origin === requestUrl.origin) {
        redirectUrl = redirectTarget.toString();
      } else {
        logger.warn('Attempted redirect to external URL blocked', { 
          requested: next,
          blocked: true 
        });
        redirectUrl = new URL('/dashboard', requestUrl.origin).toString();
      }
    } catch (urlError) {
      logger.warn('Invalid redirect URL provided, using default', { 
        requested: next,
        error: (urlError as Error).message 
      });
      redirectUrl = new URL('/dashboard', requestUrl.origin).toString();
    }

    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);

    // Set secure headers
    response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Request-ID', requestId);

    logger.info('Redirecting user', { redirectUrl });

    return response;

  } catch (error) {
    logger.error('Unexpected error in auth callback', error as Error);

    // Fallback error redirect
    try {
      const errorUrl = new URL('/auth/login', request.url);
      errorUrl.searchParams.set('error', 'callback_error');
      errorUrl.searchParams.set('message', 'An unexpected error occurred during authentication.');
      
      return NextResponse.redirect(errorUrl.toString());
    } catch (redirectError) {
      logger.error('Failed to create error redirect', redirectError as Error);
      
      // Last resort: return a simple error response
      return new NextResponse('Authentication Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'X-Request-ID': requestId
        }
      });
    }
  }
}