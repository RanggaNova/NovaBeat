import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types/song';
import { getHistory, clearHistory, getUserStats } from '../services/storageService';
import { Trash2, Flame, Award, ArrowLeft, Play, Clock } from 'lucide-react';

interface HistoryViewProps {
  onBackToTyping: () => void;
  onPlaySongAgain?: (title: string, artist: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBackToTyping }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState(getUserStats());

  useEffect(() => {
    setHistory(getHistory());
    setStats(getUserStats());
  }, []);

  const handleClear = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat bermain?')) {
      clearHistory();
      setHistory([]);
      setStats(getUserStats());
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}d`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToTyping}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Riwayat Permainan
            </h1>
            <p className="text-xs text-zinc-400">
              Catatan performa dan rekor ketukan ritme lagu Anda
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Riwayat</span>
          </button>
        )}
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="text-xs text-zinc-400 font-mono">Total Sesi</div>
          <div className="text-3xl font-mono font-black text-white mt-1 tabular-nums">
            {stats.totalTests}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="text-xs text-zinc-400 font-mono">WPM Tertinggi</div>
          <div className="text-3xl font-mono font-black text-amber-300 mt-1 tabular-nums">
            {stats.bestWpm}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="text-xs text-zinc-400 font-mono">Akurasi Rata-rata</div>
          <div className="text-3xl font-mono font-black text-cyan-400 mt-1 tabular-nums">
            {stats.avgAccuracy}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="text-xs text-zinc-400 font-mono">Total Kesalahan</div>
          <div className="text-3xl font-mono font-black text-rose-400 mt-1 tabular-nums">
            {stats.totalErrors}
          </div>
        </div>
      </div>

      {/* Daftar Riwayat */}
      {history.length === 0 ? (
        <div className="py-20 text-center space-y-3 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <Award className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Belum ada riwayat permainan</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Pilih lagu di katalog dan selesaikan tantangan mengetik ritme untuk melihat rekor kecepatanmu di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={item.cover}
                  alt={item.songTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">
                    {item.songTitle}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate">
                    {item.artist}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {formatDate(item.date)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-lg font-black text-amber-300 tabular-nums">
                    {item.wpm} <span className="text-[10px] font-normal text-zinc-400">WPM</span>
                  </div>
                  <div className="text-cyan-400 tabular-nums font-semibold">
                    {item.accuracy}% akurat
                  </div>
                </div>

                <div className="text-right border-l border-white/10 pl-4">
                  <div className="text-zinc-300 tabular-nums flex items-center gap-1 justify-end">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.highestStreak} streak</span>
                  </div>
                  <div className="text-zinc-500 tabular-nums flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(item.duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
