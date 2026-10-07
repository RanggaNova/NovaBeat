import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden shadow-inner">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-500 transition-all duration-150 ease-out rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)]"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};
