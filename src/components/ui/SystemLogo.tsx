import React from 'react';
import mnahLogo from '../../assets/MNAH_Logo.png';

interface SystemLogoProps {
  size?: number;
  loading?: boolean;
  className?: string;
  color?: string;
}

export default function SystemLogo({ 
  size = 40, 
  loading = false, 
  className = '', 
  color = '#f59e0b'
}: SystemLogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 ${loading ? 'scale-105 animate-pulse' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={mnahLogo} 
        alt="Mầm non An Hữu Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
