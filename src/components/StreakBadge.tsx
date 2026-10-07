import React, { useEffect, useState } from 'react';
import { Flame, Zap, Sparkles, Crown, Trophy } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  showDetails?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, showDetails = false }) => {
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (streak > 0) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 240);
      return () => clearTimeout(t);
    }
  }, [streak]);

  if (streak === 0) {
    return (
      <div className="flex items-center gap-1.5 text-zinc-600 font-mono text-xs transition-colors duration-200">
        <Flame className="w-4 h-4 opacity-30" />
        <span>0 COMBO</span>
      </div>
    );
  }

  // Tiers definition
  const isGodlike = streak >= 75;
  const isSupernova = streak >= 50 && !isGodlike;
  const isFever = streak >= 25 && !isSupernova && !isGodlike;
  const isFlow = streak >= 10 && !isFever && !isSupernova && !isGodlike;

  if (isGodlike) {
    return (
      <div
        className={`relative inline-flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.7)] transition-all animate-rainbow-border ${
          pop ? 'scale-110 shadow-[0_0_35px_rgba(251,191,36,0.9)]' : 'scale-100'
        }`}
      >
        <Crown className="w-4 h-4 fill-amber-200 text-amber-200 animate-bounce" />
        <span key={streak} className="inline-block tabular-nums tracking-wide animate-streak-pop">
          {streak}
        </span>
        <span className="text-[10px] uppercase tracking-wider bg-white/20 px-1 py-0.5 rounded text-white font-extrabold">
          3.0x GODLIKE
        </span>
      </div>
    );
  }

  if (isSupernova) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 border border-fuchsia-400/60 text-fuchsia-200 shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all ${
          pop ? 'scale-110 border-fuchsia-300 shadow-[0_0_30px_rgba(217,70,239,0.8)]' : 'scale-100'
        }`}
      >
        <Sparkles className="w-4 h-4 fill-fuchsia-300 text-fuchsia-300 animate-spin" />
        <span key={streak} className="inline-block tabular-nums tracking-wide animate-streak-pop text-white font-black text-sm">
          {streak}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-fuchsia-300 font-extrabold">
          2.5x NOVA
        </span>
      </div>
    );
  }

  if (isFever) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/25 via-orange-500/25 to-rose-500/25 border border-amber-400/60 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all ${
          pop ? 'scale-110 border-amber-300 shadow-[0_0_28px_rgba(245,158,11,0.8)]' : 'scale-100'
        }`}
      >
        <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-fire-flicker" />
        <span key={streak} className="inline-block tabular-nums tracking-wide animate-streak-pop text-white font-black text-sm">
          {streak}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
          2.0x FEVER
        </span>
      </div>
    );
  }

  if (isFlow) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all ${
          pop ? 'scale-110 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'scale-100'
        }`}
      >
        <Zap className="w-3.5 h-3.5 fill-cyan-300 text-cyan-300 animate-pulse" />
        <span key={streak} className="inline-block tabular-nums tracking-wide animate-streak-pop text-white font-bold">
          {streak}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-cyan-300">
          1.5x FLOW
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono font-semibold text-xs text-amber-400 transition-all ${
        pop ? 'scale-110 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'scale-100'
      }`}
    >
      <Flame className="w-3.5 h-3.5 fill-amber-400/40" />
      <span key={streak} className="inline-block tabular-nums tracking-wide animate-streak-pop font-bold text-zinc-100">
        {streak}
      </span>
      <span className="text-zinc-400 font-medium">COMBO</span>
    </div>
  );
};
