
import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none">
      {/* Mesh Gradient Layer */}
      <div className="absolute inset-0 bg-white dark:bg-[#020617] transition-colors duration-1000">
        {/* Subtle dynamic orbs with brand colors */}
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-brand-gold/10 dark:bg-brand-gold/[0.04] rounded-full blur-[140px] animate-float" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[60%] bg-[#CC092F]/[0.03] dark:bg-[#CC092F]/[0.015] rounded-full blur-[140px] animate-float animate-delay-float" />
      </div>

      {/* Financial Terminal Grid & Candlestick Simulation Overlay */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="market-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#market-grid)" />
          
          {/* Decorative candlestick simulations */}
          <g transform="translate(100, 300)">
            <rect x="0" y="20" width="4" height="40" fill="#F59E0B" opacity="0.5" />
            <path d="M2 0 L2 80" stroke="#F59E0B" strokeWidth="0.5" />
            
            <rect x="40" y="50" width="4" height="20" fill="#F59E0B" opacity="0.3" />
            <path d="M42 30 L42 90" stroke="#F59E0B" strokeWidth="0.5" />
            
            <rect x="80" y="10" width="4" height="60" fill="#F59E0B" opacity="0.6" />
            <path d="M82 -10 L82 100" stroke="#F59E0B" strokeWidth="0.5" />
          </g>
          
          {/* Large dynamic trend line */}
          <path 
            d="M0 650 Q 200 620 400 640 T 800 500 T 1200 550 T 1800 350" 
            fill="none" 
            stroke="#F59E0B" 
            strokeWidth="1.2" 
            strokeDasharray="5 5"
            className="opacity-40"
          />
        </svg>
      </div>

      {/* Digital Ticker Tape Simulation */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-brand-gold/10"></div>
      
      {/* Floating Data Nodes (Golden Dust) */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`particle particle-${i}`}
          />
        ))}
      </div>
      
      {/* Terminal Depth Filter */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,transparent_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_20%_30%,transparent_0%,rgba(0,0,0,0.2)_100%)]"></div>
    </div>
  );
};
