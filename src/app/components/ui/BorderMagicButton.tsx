import React from 'react';

interface BorderMagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  gradientColors?: string;
  bgColor?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BorderMagicButton: React.FC<BorderMagicButtonProps> = ({
  children,
  className = '',
  gradientColors = 'bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]',
  bgColor = 'bg-black-950/80',
  textColor = 'text-white',
  size = 'md',
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-8 px-2 py-0.5 text-xs',
    md: 'h-12 px-3 py-1 text-sm',
    lg: 'h-14 px-4 py-2 text-base'
  };

  return (
    <button 
      className={`relative inline-flex overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <span className={`absolute inset-[-1000%] animate-[spin_2s_linear_infinite] ${gradientColors}`} />
      <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full ${bgColor} font-medium ${textColor} backdrop-blur-3xl`}>
        {children}
      </span>
    </button>
  );
};

export default BorderMagicButton;