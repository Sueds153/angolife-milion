
import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none">
      {/* Fundo em papel quente com leve acento da marca */}
      <div className="absolute inset-0 bg-[#f6f3ec] dark:bg-[#141109] transition-colors duration-300">
        <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] bg-[#a16207]/[0.04] dark:bg-[#a16207]/[0.03] rounded-full" />
        <div className="absolute bottom-[-25%] right-[-15%] w-[55%] h-[55%] bg-[#c8102e]/[0.025] dark:bg-[#c8102e]/[0.02] rounded-full" />
      </div>

      {/* Leve vinheta para dar profundidade, sem brilho */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(30,24,15,0.03)_100%)] dark:bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.18)_100%)]" />
    </div>
  );
};
