import React from 'react';
import { TypingStats as StatsType, Song } from '../types/song';
import { StreakBadge } from './StreakBadge';
import { Play, RotateCcw, Zap, Target, AlertTriangle, Flame } from 'lucide-react';

interface TypingStatsProps {
  stats: StatsType;
  song?: Song;
  title?: string;
  artist?: string;
  currentLineIndex?: number;
  totalLines?: number;
  isGameStarted?: boolean;
  onStartTrack?: () => void;
  onRestartTrack?: () => void;
}

export const TypingStats: React.FC<TypingStatsProps> = ({
  stats,
  song,
  title,
  artist,
  currentLineIndex = 0,
  totalLines = 1,
  isGameStarted = false,
  onStartTrack,
  onRestartTrack,
}) => {
  const displayTitle = song?.title || title || 'Lagu';
  const displayArtist = song?.artist || artist || 'Musisi';

  const kpm = stats.wpm * 5;

  // Visual feedback tiers for the combo card
  const hasStreak = stats.streak > 0;
  const isHighStreak = stats.streak >= 25;
  const isGodlikeStreak = stats.streak >= 50;

  return (
    <div className="w-full h-full rounded-2xl bg-[#0a0c16]/90 border border-white/10 p-3 sm:p-3.5 backdrop-blur-2xl shadow-xl flex flex-col justify-between gap-2.5">
      {/* Top Banner: Judul Lagu & Tombol Mulai / Ulangi */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <h2 className="text-sm sm:text-base font-black text-white truncate tracking-tight">
              {displayTitle}
            </h2>
          </div>
          <p className="text-[11px] text-zinc-400 truncate font-medium">
            {displayArtist} · <span className="font-mono text-zinc-400">Baris {currentLineIndex + 1} dari {totalLines}</span>
          </p>
        </div>

        {/* Start / Restart Quick Trigger */}
        <div className="shrink-0">
          {!isGameStarted && onStartTrack ? (
            <button
              onClick={onStartTrack}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 text-zinc-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              <span>MULAI LAGU</span>
            </button>
          ) : onRestartTrack ? (
            <button
              onClick={onRestartTrack}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors flex items-center gap-1 border border-white/10 cursor-pointer"
              title="Ulangi dari 0:00"
            >
              <RotateCcw className="w-3 h-3" />
              <span>0:00</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Grid 2 Kolom x 2 Baris Simetris */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-2.5 flex-1 items-stretch">
        {/* BARIS 1, KOLOM 1: Kecepatan (WPM & KPM) */}
        <div className="p-2 sm:p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
            <span>Kecepatan</span>
            <Zap className="w-3.5 h-3.5 text-amber-400/80" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tabular-nums drop-shadow-[0_0_10px_rgba(252,211,77,0.3)] my-0.5">
            {stats.wpm}
            <span className="text-xs text-zinc-400 font-normal ml-1">WPM</span>
          </div>
          <div className="text-[10px] font-mono text-amber-200/80 font-semibold flex items-center justify-between">
            <span>{kpm} <span className="text-zinc-500 font-normal">KPM</span></span>
            <span className="text-[9px] text-zinc-500 font-normal">huruf/menit</span>
          </div>
        </div>

        {/* BARIS 1, KOLOM 2: Akurasi (%) */}
        <div className="p-2 sm:p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
            <span>Akurasi</span>
            <Target className="w-3.5 h-3.5 text-cyan-400/80" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 tabular-nums drop-shadow-[0_0_10px_rgba(6,182,212,0.3)] my-0.5">
            {stats.accuracy}%
          </div>
          <div className="text-[10px] font-mono text-cyan-200/80 flex items-center justify-between">
            <span>{stats.correctCharacters} benar</span>
            <span className="text-[9px] text-zinc-500">{stats.accuracy >= 98 ? '★ Sempurna' : 'Presisi'}</span>
          </div>
        </div>

        {/* BARIS 2, KOLOM 1: Salah Ketik */}
        <div className="p-2 sm:p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-rose-400/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
            <span>Salah Ketik</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400/80" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-rose-400 tabular-nums my-0.5">
            {stats.errors}
          </div>
          <div className="text-[10px] font-mono text-rose-300/80 flex items-center justify-between">
            <span>{stats.errors === 0 ? 'Tanpa cela' : `${stats.errors} kesalahan`}</span>
            <span className="text-[9px] text-zinc-500">melenceng</span>
          </div>
        </div>

        {/* BARIS 2, KOLOM 2: Kombo Ritme (Streak Menyala Terus) */}
        <div
          className={`p-2 sm:p-3 rounded-xl transition-all duration-300 flex flex-col justify-between ${
            isGodlikeStreak
              ? 'bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-pink-950/40 border border-fuchsia-400/50 shadow-[0_0_20px_rgba(217,70,239,0.3)] animate-rainbow-border'
              : isHighStreak
              ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-streak-fire'
              : hasStreak
              ? 'bg-gradient-to-br from-amber-950/20 to-zinc-900 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-streak-fire'
              : 'bg-white/[0.04] border border-white/10 hover:border-amber-400/30'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
            <span>Kombo Ritme</span>
            <Flame className={`w-3.5 h-3.5 ${hasStreak ? 'text-amber-400 fill-amber-400/80 animate-fire-flicker' : 'text-zinc-500'}`} />
          </div>

          <div className="flex items-baseline gap-2 my-0.5">
            <span
              className={`text-2xl sm:text-3xl font-mono font-black tabular-nums ${
                isGodlikeStreak
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300'
                  : hasStreak
                  ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.4)]'
                  : 'text-zinc-500'
              }`}
            >
              {stats.streak}
            </span>
            <span className="text-xs font-mono font-bold text-amber-400/90">
              {stats.streak >= 75 ? 'x3.0' : stats.streak >= 50 ? 'x2.5' : stats.streak >= 25 ? 'x2.0' : stats.streak >= 10 ? 'x1.5' : 'x1.0'}
            </span>
          </div>

          <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
            <span>Rekor: <strong className="text-white tabular-nums">{stats.highestStreak}</strong></span>
            <span className="text-[9px] text-amber-300 font-semibold">
              {hasStreak ? (isHighStreak ? '🔥 Menyala!' : '⚡ Aktif') : 'Mulai ketik'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
