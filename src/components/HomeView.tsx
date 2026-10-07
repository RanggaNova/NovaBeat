import React from 'react';
import { Play, Music, History, Disc3, Headphones, ArrowRight } from 'lucide-react';
import { Song } from '../types/song';
import { getUserStats } from '../services/storageService';

interface HomeViewProps {
  onStartTyping: () => void;
  onChooseSong: () => void;
  onViewHistory: () => void;
  featuredSong: Song;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartTyping,
  onChooseSong,
  onViewHistory,
  featuredSong,
}) => {
  const stats = getUserStats();

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-14 text-center space-y-12 animate-in fade-in duration-300 relative z-10">
      {/* Subtle Moving Background Waves (Samar-samar saja) */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-ambient-slow" />
        <div className="absolute top-1/3 -right-24 w-[450px] h-[450px] bg-amber-500/8 rounded-full blur-[130px] animate-ambient-reverse" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-rose-500/8 rounded-full blur-[120px] animate-ambient-slow" />
      </div>

      {/* Hero Section */}
      <div className="space-y-6">
        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
          Ketik Mengikuti <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-300 via-amber-200 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.3)]">
            Ritme Vokal Lagu
          </span>
        </h1>

        {/* Indonesian Description */}
        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Rasakan sensasi mengetik kalimat demi kalimat lirik lagu favoritmu secara sinkron dengan video dan audio musik asli. Jaga ketukan ritme tanpa salah untuk memicu efek api kombo beruntun.
        </p>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          onClick={onStartTyping}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 text-zinc-950 font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_45px_rgba(251,191,36,0.45)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-5 h-5 fill-zinc-950" />
          <span>Mulai Main Sekarang</span>
        </button>

        <button
          onClick={onChooseSong}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-xl cursor-pointer"
        >
          <Music className="w-4 h-4 text-cyan-400" />
          <span>Pilih Lagu Lain</span>
        </button>
      </div>

      {/* Featured Track Card — Bersih, tanpa outline button kaku, artwork alami */}
      <div className="inline-flex items-center gap-4 p-3.5 pr-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-2xl text-left shadow-xl transition-all group">
        {/* Cover Artwork — Tanpa outline border */}
        <div className="relative w-14 h-14 rounded-xl bg-zinc-900 overflow-hidden shrink-0 shadow-lg">
          <img
            src={featuredSong.cover}
            alt={featuredSong.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <Disc3 className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
            <Headphones className="w-3 h-3" />
            <span>Lagu Pilihan Hari Ini</span>
          </div>
          <div className="text-sm sm:text-base font-black text-white truncate group-hover:text-cyan-200 transition-colors">
            {featuredSong.title}
          </div>
          <div className="text-xs text-zinc-400 truncate">
            {featuredSong.artist}
          </div>
        </div>

        <button
          onClick={onStartTyping}
          className="ml-3 px-4 py-2 rounded-xl bg-cyan-400 text-zinc-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:bg-cyan-300 shadow-md hover:scale-105 active:scale-95"
        >
          <span>Mainkan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Keunggulan Fitur (Desain Bersih, Tanpa Outline Buatan AI) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto text-left">
        <div className="p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-all relative overflow-hidden group shadow-md">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-300 font-black text-sm mb-4">
            01
          </div>
          <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-cyan-300 transition-colors">
            Kalimat Demi Kalimat
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
            Lirik muncul baris per baris secara fokus. Begitu selesai mengetik satu kalimat, baris berikutnya akan langsung mengalir mulus tanpa distraksi.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-all relative overflow-hidden group shadow-md">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-300 font-black text-sm mb-4">
            02
          </div>
          <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-amber-300 transition-colors">
            Sinkronisasi Video Asli
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
            Video YouTube disematkan di pojok atas bersama instrumen audio, memudahkanmu menyesuaikan tempo ketukan jari dengan tempo nyanyian artis.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-all relative overflow-hidden group shadow-md">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-300 font-black text-sm mb-4">
            03
          </div>
          <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-rose-300 transition-colors">
            Efek Kombo & Streak Menyala
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
            Ketik tanpa salah untuk membangun kombo beruntun. Efek visual api akan menyala terus menerus menemani permainanmu selama tidak membuat kesalahan.
          </p>
        </div>
      </div>

      {/* Rekor Skor Pengguna */}
      {stats.totalTests > 0 && (
        <div className="pt-6 border-t border-white/5 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-semibold">
              Rekor Permainan Anda
            </span>
            <button
              onClick={onViewHistory}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors font-semibold cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Lihat Semua Riwayat</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] shadow-md">
              <div className="text-xs text-zinc-400 font-mono">Sesi Selesai</div>
              <div className="text-2xl font-mono font-black text-white mt-1 tabular-nums">
                {stats.totalTests}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] shadow-md">
              <div className="text-xs text-cyan-400 font-mono">WPM Terbaik</div>
              <div className="text-2xl font-mono font-black text-cyan-300 mt-1 tabular-nums">
                {stats.bestWpm}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] shadow-md">
              <div className="text-xs text-amber-400 font-mono">Streak Tertinggi</div>
              <div className="text-2xl font-mono font-black text-amber-300 mt-1 tabular-nums">
                {stats.highestStreak}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
