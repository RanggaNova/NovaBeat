import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Youtube,
} from 'lucide-react';
import { Song } from '../types/song';

export interface FullAudioPlayerHandle {
  play: () => void;
  pause: () => void;
  restart: () => void;
  seekTo: (seconds: number) => void;
}

export interface FullAudioPlayerProps {
  song: Song;
  onTimeUpdate: (currentTimeSeconds: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  isGameStarted: boolean;
  onStartTrack: () => void;
  onRestartTrack?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const FullAudioPlayer = forwardRef<FullAudioPlayerHandle, FullAudioPlayerProps>(({
  song,
  onTimeUpdate,
  onPlayStateChange,
  isGameStarted,
  onStartTrack,
  onRestartTrack,
}, ref) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(song.duration || 200);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<'youtube' | 'audio'>(song.youtubeId ? 'youtube' : 'audio');
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytWrapperRef = useRef<HTMLDivElement | null>(null);
  const timeUpdateTimerRef = useRef<any>(null);
  const playPendingRef = useRef<boolean>(false);

  // Initialize YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Sync duration with song metadata
  useEffect(() => {
    if (song.duration) {
      setDuration(song.duration);
    }
  }, [song.duration]);

  // Clean up and reset player when song changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setIsPlayerReady(false);
    playPendingRef.current = false;
    onPlayStateChange(false);

    if (timeUpdateTimerRef.current) {
      clearInterval(timeUpdateTimerRef.current);
    }

    if (song.youtubeId) {
      setPlayerMode('youtube');
    } else {
      setPlayerMode('audio');
    }

    // Reset and rewind audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (song.previewUrl) {
        audioRef.current.src = song.previewUrl;
        audioRef.current.load();
      }
    }

    // Reset and rewind YouTube player if already exists
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
        ytPlayerRef.current.seekTo(0, true);
      } catch {}
    }
  }, [song.id, song.youtubeId, song.previewUrl, onPlayStateChange]);

  // Play from start: strict rewind to 0:00 and immediate playback
  const playFromBeginning = useCallback(() => {
    setCurrentTime(0);
    onTimeUpdate(0);

    if (playerMode === 'youtube') {
      if (ytPlayerRef.current && isPlayerReady) {
        try {
          ytPlayerRef.current.seekTo(0, true);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          onPlayStateChange(true);
          return;
        } catch {
          setPlayerMode('audio');
        }
      } else {
        // Queue play request once YouTube is ready
        playPendingRef.current = true;
      }
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        onPlayStateChange(true);
      }).catch(() => {});
    }
  }, [playerMode, isPlayerReady, onTimeUpdate, onPlayStateChange]);

  // Resume or start playback
  const handlePlay = useCallback(() => {
    if (!isGameStarted) {
      onStartTrack();
    }

    if (currentTime === 0) {
      playFromBeginning();
      return;
    }

    if (playerMode === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        onPlayStateChange(true);
      } catch {
        setPlayerMode('audio');
        audioRef.current?.play().catch(() => {});
      }
    } else if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        onPlayStateChange(true);
      }).catch(() => {});
    }
  }, [currentTime, playFromBeginning, playerMode, onPlayStateChange, isGameStarted, onStartTrack]);

  // Pause playback
  const handlePause = useCallback(() => {
    if (playerMode === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
        onPlayStateChange(false);
      } catch {}
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange(false);
    }
  }, [playerMode, onPlayStateChange]);

  const handleSeekTo = useCallback((targetSeconds: number) => {
    setCurrentTime(targetSeconds);
    onTimeUpdate(targetSeconds);

    if (playerMode === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(targetSeconds, true);
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.currentTime = targetSeconds;
    }
  }, [playerMode, onTimeUpdate]);

  // Expose imperative handle so parent components can control playback
  useImperativeHandle(ref, () => ({
    play: handlePlay,
    pause: handlePause,
    restart: () => {
      if (onRestartTrack) onRestartTrack();
      playFromBeginning();
    },
    seekTo: handleSeekTo,
  }), [handlePlay, handlePause, handleSeekTo, onRestartTrack, playFromBeginning]);

  // Initialize YouTube player instance inside isolated wrapper div
  useEffect(() => {
    if (playerMode !== 'youtube' || !song.youtubeId) return;

    let isMounted = true;
    let pollInterval: any = null;

    const createPlayer = () => {
      if (!isMounted || !ytWrapperRef.current || !window.YT || !window.YT.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }

      // Re-create child div target so YouTube iframe replacement always works cleanly
      ytWrapperRef.current.innerHTML = '<div class="w-full h-full"></div>';
      const targetElement = ytWrapperRef.current.firstElementChild;
      if (!targetElement) return;

      try {
        ytPlayerRef.current = new window.YT.Player(targetElement, {
          height: '100%',
          width: '100%',
          videoId: song.youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 1, // Native YouTube controls available
            disablekb: 1, // Prevents YouTube iframe from capturing keyboard typing
            fs: 1,
            modestbranding: 1,
            rel: 0,
            start: 0,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsPlayerReady(true);
              event.target.setVolume(volume * 100);
              event.target.seekTo(0, true);
              const d = event.target.getDuration();
              if (d && !isNaN(d) && d > 0) {
                setDuration(d);
              }
              if (playPendingRef.current || isGameStarted) {
                playPendingRef.current = false;
                event.target.playVideo();
                setIsPlaying(true);
                onPlayStateChange(true);
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // YT.PlayerState: PLAYING === 1, PAUSED === 2, ENDED === 0, BUFFERING === 3, CUED === 5
              if (event.data === 1) {
                setIsPlaying(true);
                onPlayStateChange(true);
              } else {
                // When stopped, paused, ended or buffering
                setIsPlaying(false);
                onPlayStateChange(false);
              }
            },
            onError: () => {
              if (!isMounted) return;
              setPlayerMode('audio');
              if (audioRef.current && song.previewUrl) {
                audioRef.current.currentTime = 0;
              }
            },
          },
        });
      } catch (err) {
        console.warn('Failed to initialize YouTube player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      pollInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(pollInterval);
          createPlayer();
        }
      }, 150);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [song.youtubeId, playerMode, song.previewUrl]);

  // High-frequency polling for synchronized lyrics accuracy (40ms ~ 25fps)
  useEffect(() => {
    if (!isPlaying) {
      if (timeUpdateTimerRef.current) clearInterval(timeUpdateTimerRef.current);
      return;
    }

    timeUpdateTimerRef.current = setInterval(() => {
      if (playerMode === 'youtube' && ytPlayerRef.current) {
        try {
          const t = ytPlayerRef.current.getCurrentTime();
          if (typeof t === 'number' && !isNaN(t)) {
            setCurrentTime(t);
            onTimeUpdate(t);
          }
        } catch {}
      } else if (audioRef.current) {
        const t = audioRef.current.currentTime;
        setCurrentTime(t);
        onTimeUpdate(t);
      }
    }, 40);

    return () => {
      if (timeUpdateTimerRef.current) clearInterval(timeUpdateTimerRef.current);
    };
  }, [isPlaying, playerMode, onTimeUpdate]);

  // Synchronize with external isGameStarted state
  useEffect(() => {
    if (isGameStarted && !isPlaying) {
      playFromBeginning();
    } else if (!isGameStarted && isPlaying) {
      handlePause();
      setCurrentTime(0);
      onTimeUpdate(0);
      if (playerMode === 'youtube' && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(0, true);
        } catch {}
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [isGameStarted]);

  // HTML5 audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioPlay = () => {
      setIsPlaying(true);
      onPlayStateChange(true);
    };
    const handleAudioPause = () => {
      setIsPlaying(false);
      onPlayStateChange(false);
    };
    const handleAudioEnded = () => {
      setIsPlaying(false);
      onPlayStateChange(false);
    };

    audio.addEventListener('play', handleAudioPlay);
    audio.addEventListener('pause', handleAudioPause);
    audio.addEventListener('ended', handleAudioEnded);

    return () => {
      audio.removeEventListener('play', handleAudioPlay);
      audio.removeEventListener('pause', handleAudioPause);
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [onPlayStateChange]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (playerMode === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(val * 100);
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (playerMode === 'youtube' && ytPlayerRef.current) {
      try {
        if (next) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * (duration || 200);

    handleSeekTo(targetSeconds);
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full h-full rounded-2xl bg-zinc-950/90 border border-white/10 overflow-hidden shadow-xl flex flex-col justify-between backdrop-blur-2xl">
      {/* Top Header Badge */}
      <div className="px-3 py-1.5 bg-white/[0.04] border-b border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Youtube className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span className="font-semibold text-white tracking-wide">YouTube Sync</span>
        </div>
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
              ⏸️ Dijeda
            </span>
          )}
        </div>
      </div>

      {/* Video Canvas Container (Compact 16:9 box in the top-left) */}
      <div className="w-full aspect-video bg-black relative overflow-hidden group select-none">
        {/* Real YouTube Video Player Target */}
        <div ref={ytWrapperRef} className="w-full h-full" />

        {/* HTML5 Audio Player (Fallback) */}
        <audio
          ref={audioRef}
          src={song.previewUrl}
          preload="auto"
        />

        {/* Overlay when paused */}
        {!isPlaying && (
          <div
            onClick={handlePlay}
            className="absolute inset-0 bg-black/60 hover:bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all z-10"
          >
            <div className="w-12 h-12 rounded-full bg-rose-600/90 group-hover:bg-rose-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.7)] transition-transform group-hover:scale-110 active:scale-95">
              <Play className="w-5 h-5 ml-0.5 fill-white" />
            </div>
            <div className="text-center px-4">
              <p className="text-xs font-bold text-white drop-shadow tracking-wide">
                {currentTime === 0 ? 'Mulai Putar Video' : 'Lanjutkan Putar Video'}
              </p>
              <p className="text-[10px] text-zinc-300 drop-shadow mt-0.5">
                (Ketikan otomatis terbuka saat video diputar)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Compact Video Playback Toolbar */}
      <div className="px-3 py-2 bg-white/[0.02] border-t border-white/5 flex flex-col gap-1.5 font-mono text-xs">
        {/* Scrubber Timeline */}
        <div className="w-full flex items-center gap-2 text-[10px] text-zinc-400">
          <span className="tabular-nums w-7 text-right">{formatSec(currentTime)}</span>
          <div
            className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all"
            onClick={handleSeek}
            title="Geser waktu video"
          >
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-300 to-cyan-400 rounded-full"
              style={{ width: `${Math.min(100, (currentTime / (duration || 200)) * 100)}%` }}
            />
          </div>
          <span className="tabular-nums w-7">{formatSec(duration)}</span>
        </div>

        {/* Bottom Buttons: Play, Rewind, Volume */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-md hover:bg-rose-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isPlaying ? 'Jeda Lagu & Kunci Ketikan' : 'Putar Lagu & Buka Ketikan'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={() => {
                if (onRestartTrack) onRestartTrack();
                playFromBeginning();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-white/5 transition-colors cursor-pointer"
              title="Mulai Ulang Lagu (0:00)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              {isPlaying ? '♪ Memutar Musik' : '⏸️ Berhenti (Ketik Terkunci)'}
            </span>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer"
              title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume Musik"
              className="w-14 h-1 bg-white/10 accent-rose-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

FullAudioPlayer.displayName = 'FullAudioPlayer';
