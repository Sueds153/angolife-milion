
import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none">
      {/* Clean background with a single subtle brand tint */}
      <div className="absolute inset-0 bg-white dark:bg-[#0b1220] transition-colors duration-300">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-brand-gold/[0.05] dark:bg-brand-gold/[0.03] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-[#CC092F]/[0.02] dark:bg-[#CC092F]/[0.015] rounded-full blur-[160px]" />
      </div>

      {/* Soft vertical vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.12)_100%)]" />
    </div>
  );
};
