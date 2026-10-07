import React from 'react';
import { Volume2, VolumeX, RotateCcw, Music, History, Play, Sparkles } from 'lucide-react';
import { ViewMode } from '../types/song';

interface HeaderProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRestart?: () => void;
  showRestart?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  soundEnabled,
  onToggleSound,
  onRestart,
  showRestart = false,
}) => {
  return (
    <header className="w-full border-b border-white/10 bg-[#07080f]/80 backdrop-blur-2xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand: Nova beat */}
        <button
          onClick={() => onNavigate('HOME')}
          className="text-lg font-black tracking-tight text-white hover:opacity-95 transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-amber-300 to-rose-500 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.45)] group-hover:shadow-[0_0_25px_rgba(251,191,36,0.6)] transition-shadow">
            <div className="w-full h-full bg-[#0a0c16] rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <span className="font-mono text-cyan-400 font-black text-lg group-hover:scale-110 transition-transform">N</span>
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent flex items-center gap-1.5">
              <span>Nova beat</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </span>
            <span className="text-[10px] font-mono text-zinc-400 -mt-1 hidden sm:block tracking-wider uppercase font-semibold">
              Rhythm Typing
            </span>
          </div>
        </button>

        {/* Navigation Links in Indonesian */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold text-zinc-400">
          <button
            onClick={() => onNavigate('TYPING')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'TYPING'
                ? 'text-white bg-white/10 shadow-inner border border-white/10'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span>Main</span>
          </button>

          <button
            onClick={() => onNavigate('SONGS')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'SONGS'
                ? 'text-white bg-white/10 shadow-inner border border-white/10'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-pink-400" />
            <span>Katalog Lagu</span>
          </button>

          <button
            onClick={() => onNavigate('HISTORY')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'HISTORY'
                ? 'text-white bg-white/10 shadow-inner border border-white/10'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Riwayat</span>
          </button>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {showRestart && onRestart && (
            <button
              onClick={onRestart}
              title="Ulangi dari 0:00 (Tab atau Esc)"
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              aria-label="Ulangi lagu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Suara ketikan aktif' : 'Suara ketikan dibisukan'}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              soundEnabled
                ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
            aria-label="Pengaturan suara"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
