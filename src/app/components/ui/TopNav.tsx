import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const TopNav: React.FC = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeRoute, setActiveRoute] = useState('');
  const router = useRouter();
  const { user, isAuthenticated, signOut, isLoading: authLoading } = useAuth();

  const handleNavigation = async (href: string, e: React.MouseEvent) => {
    // Don't prevent default - let Link handle the navigation
    setIsNavigating(true);
    setActiveRoute(href);
    
    try {
      // Show loading animation briefly for satisfaction
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Let Next.js Link handle the actual navigation
      // The loading state will be cleared when the new page loads
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
      setActiveRoute('');
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    try {
      await signOut();
      router.push('/');
      setIsNavigating(false);
    } catch (error) {
      console.error('Sign out failed:', error);
      setIsNavigating(false);
    }
  };

  // Clear loading state when navigation completes
  React.useEffect(() => {
    const handleRouteChange = () => {
      setIsNavigating(false);
      setActiveRoute('');
    };

    // Listen for route changes to clear loading state
    const timer = setTimeout(handleRouteChange, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-black/95 backdrop-blur-md border border-neutral-700/50 rounded-full px-8 py-3 shadow-2xl">
        <div className="flex items-center justify-between min-w-[600px]">
          {/* Brand */}
          <div className="text-white font-heading font-bold text-lg">
            LatentSee
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {isNavigating && (
              <div className="flex items-center gap-2 text-accent-400 text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">Loading...</span>
              </div>
            )}
            
            <Link 
              href="/"
              onClick={(e) => handleNavigation('/', e)}
              className={`text-neutral-300 hover:text-white transition-all duration-200 font-medium text-sm transform hover:scale-105 ${
                activeRoute === '/' ? 'text-accent-400' : ''
              }`}
            >
              Home
            </Link>
            <Link 
              href="/analytics"
              onClick={(e) => handleNavigation('/analytics', e)}
              className={`text-neutral-300 hover:text-white transition-all duration-200 font-medium text-sm transform hover:scale-105 ${
                activeRoute === '/analytics' ? 'text-accent-400' : ''
              }`}
            >
              Analytics
            </Link>
            <Link 
              href="/docs"
              onClick={(e) => handleNavigation('/docs', e)}
              className={`text-neutral-300 hover:text-white transition-all duration-200 font-medium text-sm transform hover:scale-105 ${
                activeRoute === '/docs' ? 'text-accent-400' : ''
              }`}
            >
              Docs
            </Link>
            
            {/* Conditional Auth Links */}
            {!authLoading && (
              <>
                {isAuthenticated ? (
                  <>
                    {/* Dashboard Link */}
                    <Link 
                      href="/dashboard"
                      onClick={(e) => handleNavigation('/dashboard', e)}
                      className={`text-neutral-300 hover:text-white transition-all duration-200 font-medium text-sm transform hover:scale-105 ${
                        activeRoute === '/dashboard' ? 'text-accent-400' : ''
                      }`}
                    >
                      Dashboard
                    </Link>
                    
                    {/* User Menu */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <User className="w-4 h-4" />
                        <span>{user?.profile?.firstName || user?.email?.split('@')[0] || 'User'}</span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="text-neutral-300 hover:text-red-400 transition-all duration-200 font-medium text-sm transform hover:scale-105 flex items-center gap-1"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Login Link for unauthenticated users */
                  <Link 
                    href="/auth/login"
                    onClick={(e) => handleNavigation('/auth/login', e)}
                    className={`text-neutral-300 hover:text-white transition-all duration-200 font-medium text-sm transform hover:scale-105 ${
                      activeRoute === '/auth/login' ? 'text-accent-400' : ''
                    }`}
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;