/**
 * Auth Utilities for handling token management and cleanup
 */

export const authUtils = {
  /**
   * Clear all Supabase auth data from localStorage
   */
  clearAuthStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear common Supabase auth keys
      const keysToRemove = [
        'supabase.auth.token',
        'sb-auth-token'
      ];
      
      // Clear project-specific auth keys
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
        if (projectId) {
          keysToRemove.push(`sb-${projectId}-auth-token`);
        }
      }
      
      // Remove all auth-related keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear any keys that might contain auth data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      console.debug('[AuthUtils] Cleared auth storage');
    } catch (error) {
      console.warn('[AuthUtils] Failed to clear auth storage:', error);
    }
  },

  /**
   * Check if we have valid auth data in storage
   */
  hasValidAuthData(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) return false;
      
      const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
      const authKey = `sb-${projectId}-auth-token`;
      const authData = localStorage.getItem(authKey);
      
      if (!authData) return false;
      
      const parsed = JSON.parse(authData);
      const expiresAt = parsed?.expires_at;
      
      // Check if token is expired
      if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
        console.debug('[AuthUtils] Auth token expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('[AuthUtils] Error checking auth data:', error);
      return false;
    }
  },

  /**
   * Force a clean auth initialization
   */
  forceCleanAuth(): void {
    this.clearAuthStorage();
    // Reload the page to reinitialize auth
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
};