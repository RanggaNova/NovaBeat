import React from 'react';
import { TypingStats, Song } from '../types/song';
import { RotateCcw, Music, Flame, Clock, CheckCircle2, History, Sparkles } from 'lucide-react';

interface ResultViewProps {
  song: Song;
  stats: TypingStats;
  onTryAgain: () => void;
  onChooseAnotherSong: () => void;
  onViewHistory: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  song,
  stats,
  onTryAgain,
  onChooseAnotherSong,
  onViewHistory,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}d`;
  };

  const totalCharacters = stats.correctCharacters + stats.incorrectCharacters;

  return (
    <div className="w-full max-w-2xl mx-auto py-8 text-center space-y-8 animate-in fade-in duration-300">
      {/* Header Penyelesaian */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Lagu Selesai Dinyanyikan</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          {song.title}
        </h1>
        <p className="text-zinc-300 text-base font-semibold">
          {song.artist}
        </p>
      </div>

      {/* 3 Metrik Utama */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="p-2 sm:p-4">
          <div className="text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1">
            WPM (Kecepatan)
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-black text-amber-300 tabular-nums drop-shadow-[0_0_12px_rgba(252,211,77,0.4)]">
            {stats.wpm}
          </div>
        </div>

        <div className="p-2 sm:p-4 border-x border-white/10">
          <div className="text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1">
            Akurasi
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-black text-cyan-400 tabular-nums drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            {stats.accuracy}%
          </div>
        </div>

        <div className="p-2 sm:p-4">
          <div className="text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1">
            Salah Ketik
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-black text-rose-400 tabular-nums">
            {stats.errors}
          </div>
        </div>
      </div>

      {/* Metrik Sekunder */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm font-mono text-zinc-300">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/40" />
          <span>Kombo Max: <strong className="text-amber-300 tabular-nums font-bold">{stats.highestStreak}</strong></span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Durasi: <strong className="text-white tabular-nums font-bold">{formatTime(stats.elapsedSeconds)}</strong></span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2">
          <span>Karakter: <strong className="text-white tabular-nums font-bold">{stats.correctCharacters}</strong> / {totalCharacters}</span>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          onClick={onTryAgain}
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 text-zinc-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Mainkan Lagi</span>
        </button>

        <button
          onClick={onChooseAnotherSong}
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
        >
          <Music className="w-4 h-4 text-cyan-400" />
          <span>Pilih Lagu Lain</span>
        </button>

        <button
          onClick={onViewHistory}
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>Riwayat Nilai</span>
        </button>
      </div>
    </div>
  );
};
