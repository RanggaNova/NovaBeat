import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, Disc3, Radio } from 'lucide-react';
import { Song } from '../types/song';

interface MusicPlayerProps {
  song: Song;
  autoPlayTrigger?: number; // timestamp to trigger playback when typing starts
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  song,
  autoPlayTrigger,
  onPlaybackStateChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // When song changes, reset and load new preview
  useEffect(() => {
    setCurrentTime(0);
    setHasError(false);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (song.previewUrl) {
        audioRef.current.src = song.previewUrl;
        audioRef.current.load();
      }
    }
  }, [song.id, song.previewUrl]);

  // When autoPlayTrigger changes (e.g. user starts typing), play music!
  useEffect(() => {
    if (autoPlayTrigger && song.previewUrl && audioRef.current && !isPlaying) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlaybackStateChange?.(true);
        })
        .catch((err) => {
          console.warn('Audio auto-play blocked by browser policy:', err);
        });
    }
  }, [autoPlayTrigger, song.previewUrl, onPlaybackStateChange]);

  const togglePlay = () => {
    if (!audioRef.current || !song.previewUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlaybackStateChange?.(true);
        })
        .catch((err) => {
          console.warn('Play error:', err);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    // Loop smoothly
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.muted = next;
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={song.previewUrl}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
      />

      {/* Left: Track Information */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-12 h-12 rounded-xl bg-zinc-900/60 shrink-0 overflow-hidden border border-white/10 flex items-center justify-center shadow-md">
          {song.cover ? (
            <img
              src={song.cover}
              alt={song.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isPlaying ? 'scale-110' : 'scale-100'
              }`}
            />
          ) : (
            <Music className="w-5 h-5 text-zinc-500" />
          )}

          {/* Vinyl spin animation badge if playing */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 sm:max-w-xs">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white truncate">
              {song.title}
            </h4>
            {isPlaying && (
              <span className="flex items-end gap-[3px] h-3.5 shrink-0" title="Rhythm track active">
                <span className="w-[3px] h-3.5 bg-gradient-to-t from-cyan-500 to-amber-400 rounded-full animate-pulse" />
                <span className="w-[3px] h-2 bg-gradient-to-t from-pink-500 to-cyan-400 rounded-full animate-pulse delay-75" />
                <span className="w-[3px] h-3 bg-gradient-to-t from-amber-400 to-purple-400 rounded-full animate-pulse delay-150" />
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
            {song.artist}
          </p>
        </div>
      </div>

      {/* Center: Playback Controls & Progress Bar */}
      <div className="flex-1 w-full sm:max-w-md flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!song.previewUrl || hasError}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              !song.previewUrl || hasError
                ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                : isPlaying
                ? 'bg-gradient-to-r from-cyan-400 to-amber-400 text-zinc-950 shadow-lg shadow-cyan-400/20 hover:scale-105 active:scale-95'
                : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105 active:scale-95'
            }`}
            title={
              !song.previewUrl
                ? 'Audio preview not available for this song'
                : isPlaying
                ? 'Pause song audio'
                : 'Play song audio'
            }
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-zinc-950" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            )}
          </button>

          <div className="text-xs font-mono">
            {hasError ? (
              <span className="text-zinc-500">Audio stream unavailable</span>
            ) : song.previewUrl ? (
              <span className={isPlaying ? 'text-cyan-300 font-semibold' : 'text-zinc-400'}>
                {isPlaying ? '♪ Audio streaming in sync' : 'Press Play or start typing'}
              </span>
            ) : (
              <span className="text-zinc-500">Instrumental / No preview</span>
            )}
          </div>
        </div>

        {/* Progress Slider */}
        {song.previewUrl && !hasError && (
          <div className="w-full flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="tabular-nums w-8 text-right">{formatSec(currentTime)}</span>
            <div
              className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                if (audioRef.current && duration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = pos * duration;
                }
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, (currentTime / (duration || 30)) * 100)}%` }}
              />
            </div>
            <span className="tabular-nums w-8">{formatSec(duration)}</span>
          </div>
        )}
      </div>

      {/* Right: Volume Slider */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={toggleMute}
          className="text-zinc-400 hover:text-white p-1.5 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label="Track volume"
          className="w-20 h-1.5 bg-white/10 accent-cyan-400 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
