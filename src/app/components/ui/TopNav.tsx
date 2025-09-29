import React from 'react';
import Link from 'next/link';

const TopNav: React.FC = () => {
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/90 backdrop-blur-md border border-neutral-700/50 rounded-full px-8 py-4">
        <div className="flex items-center justify-between min-w-[500px]">
          {/* Brand */}
          <div className="text-white font-heading font-bold text-lg">
            LatentSee
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="/"
              className="text-neutral-300 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              Home
            </Link>
            <Link 
              href="/analytics"
              className="text-neutral-300 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              Analytics
            </Link>
            <Link 
              href="/docs"
              className="text-neutral-300 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              Docs
            </Link>
            
            {/* Login Link */}
            <Link 
              href="/auth/login"
              className="text-neutral-300 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;