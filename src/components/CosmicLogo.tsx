import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
}

export const CosmicLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  withText = false 
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const iconElement = (
    <div
      className={`relative flex items-center justify-center shadow-lg shadow-indigo-500/25 bg-gradient-to-br from-[#38bdf8] via-[#4f46e5] to-[#8b5cf6] border border-white/30 overflow-hidden shrink-0 ${sizeMap[size]} ${className}`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-gradient from-white/35 via-transparent to-transparent opacity-60" />

      {/* SVG Icon matching user screenshots: Glowing 8-pointed cosmic star */}
      <svg
        viewBox="0 0 100 100"
        className="w-4/5 h-4/5 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main 4 cardinal rays */}
        <path
          d="M 50 12 
             C 50 34, 62 46, 88 50 
             C 62 54, 50 66, 50 88 
             C 50 66, 38 54, 12 50 
             C 38 46, 50 34, 50 12 Z"
          fill="#FFFFFF"
        />

        {/* Diagonal 4 rays */}
        <path
          d="M 50 24 
             C 50 40, 58 48, 76 50 
             C 58 52, 50 60, 50 76 
             C 50 60, 42 52, 24 50 
             C 42 48, 50 40, 50 24 Z"
          transform="rotate(45 50 50)"
          fill="#E0E7FF"
          opacity="0.9"
        />

        {/* Center bright core */}
        <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
      </svg>
    </div>
  );

  if (!withText) {
    return iconElement;
  }

  return (
    <div className="flex items-center gap-2.5">
      {iconElement}
      <span className="font-bold text-lg tracking-tight flex items-center">
        <span className="text-white">Game</span>
        <span className="text-[#8B5CF6]">Forge</span>
      </span>
    </div>
  );
};
