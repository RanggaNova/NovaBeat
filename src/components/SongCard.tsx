import React from 'react';
import { Song } from '../types/song';
import { Clock, Music, Play } from 'lucide-react';

interface SongCardProps {
  song: Song;
  onSelect: (song: Song) => void;
  isSelected?: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({ song, onSelect, isSelected = false }) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <button
      onClick={() => onSelect(song)}
      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer backdrop-blur-md ${
        isSelected
          ? 'bg-cyan-500/15 text-white shadow-[0_4px_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
          : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white shadow-md hover:shadow-xl'
      }`}
    >
      {/* Cover Artwork — Tanpa outline border, natural soft shadow */}
      <div className="w-14 h-14 rounded-xl bg-zinc-900 shrink-0 overflow-hidden relative flex items-center justify-center shadow-md">
        {song.cover ? (
          <img
            src={song.cover}
            alt={`${song.title} cover`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <Music className="w-6 h-6 text-zinc-600" />
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-5 h-5 fill-white text-white drop-shadow" />
        </div>
      </div>

      {/* Song Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white truncate group-hover:text-cyan-300 transition-colors text-sm sm:text-base">
          {song.title}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
          {song.artist}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="tabular-nums">{formatDuration(song.duration)}</span>
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-cyan-400/90 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Video YouTube</span>
          </span>
        </div>
      </div>
    </button>
  );
};
