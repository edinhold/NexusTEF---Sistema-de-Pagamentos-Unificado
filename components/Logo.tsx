
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = true,
  textColor = 'text-slate-900'
}) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', gap: 'gap-2' },
    md: { icon: 'w-10 h-10', text: 'text-xl', gap: 'gap-3' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl', gap: 'gap-4' },
    xl: { icon: 'w-24 h-24', text: 'text-4xl', gap: 'gap-6' },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      <div className={`${currentSize.icon} relative flex items-center justify-center`}>
        {/* Main Hexagon Background */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-xl">
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path 
            d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
            fill="url(#logo-grad)"
          />
          {/* Circuit Lines */}
          <path 
            d="M30 40 L50 40 L50 60 L70 60" 
            stroke="white" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
            opacity="0.3"
          />
          <circle cx="30" cy="40" r="3" fill="white" opacity="0.5" />
          <circle cx="70" cy="60" r="3" fill="white" opacity="0.5" />
        </svg>
        
        {/* Stylized N */}
        <span className="relative z-10 text-white font-black leading-none select-none" 
              style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '20px' : size === 'lg' ? '32px' : '48px' }}>
          N
        </span>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <h1 className={`${currentSize.text} font-black tracking-tight ${textColor}`}>
            Nexus<span className="text-indigo-600">TEF</span>
          </h1>
          {size !== 'sm' && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              Intelligence Hub
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
