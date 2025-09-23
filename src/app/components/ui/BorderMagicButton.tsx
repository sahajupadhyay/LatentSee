import React from 'react';

interface BorderMagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BorderMagicButton: React.FC<BorderMagicButtonProps> = ({
  children,
  className = '',
  primaryColor = '#00C6AE', // Default to accent teal
  size = 'md',
  ...props
}) => {
  return (
    <button 
      className={`border-magic-button relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none active:outline-none active:ring-0 transition-all duration-200 ${className}`}
      style={{ boxShadow: 'none' }}
      {...props}
    >
      <span 
        className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite]"
        style={{
          background: `conic-gradient(from 90deg at 50% 50%, ${primaryColor} 0%, transparent 50%, ${primaryColor} 100%)`
        }}
      />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
        {children}
      </span>
    </button>
  );
};

export default BorderMagicButton;