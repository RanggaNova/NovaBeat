import React, { useRef, useEffect } from 'react';
import { FloatingParticle } from '../hooks/useRhythmTypingEngine';
import { SyncedLyricLine } from '../types/song';
import { Sparkles, ArrowRight, Music2, Clock, CheckCircle2, Flame, Zap, Crown, Mic, Pause, Play } from 'lucide-react';

interface RhythmTypingAreaProps {
  activeLine: SyncedLyricLine;
  nextLine: SyncedLyricLine | null;
  currentLineIndex: number;
  totalLines: number;
  charIndexInLine: number;
  typedInLine: (string | null)[];
  isTransitioning: boolean;
  isLineCompletedAhead?: boolean;
  isIntro?: boolean;
  introSecondsLeft?: number;
  audioCurrentTime?: number;
  vocalProgress?: number;
  vocalCharIndex?: number;
  isVocalSinging?: boolean;
  isAudioInLine?: boolean;
  isPlaying?: boolean;
  onResumePlay?: () => void;
  lineFeedback: string | null;
  particles: FloatingParticle[];
  isShaking: boolean;
  streak: number;
  onKeyDown: (e: KeyboardEvent) => void;
  isFinished: boolean;
}

export const RhythmTypingArea: React.FC<RhythmTypingAreaProps> = ({
  activeLine,
  nextLine,
  currentLineIndex,
  totalLines,
  charIndexInLine,
  typedInLine,
  isTransitioning,
  isLineCompletedAhead = false,
  isIntro = false,
  introSecondsLeft = 0,
  audioCurrentTime = 0,
  vocalProgress = 0,
  vocalCharIndex = 0,
  isVocalSinging = false,
  isAudioInLine = false,
  isPlaying = false,
  onResumePlay,
  lineFeedback,
  particles,
  isShaking,
  streak,
  onKeyDown,
  isFinished,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Capture global keydown events - strictly disabled when song is stopped/paused!
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // REQUIREMENT: Cannot type when song/video is stopped or paused!
      if (!isPlaying) {
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        target !== hiddenInputRef.current
      ) {
        return;
      }
      onKeyDown(e);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onKeyDown, isPlaying]);

  const handleContainerClick = () => {
    if (isPlaying && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  const formatTimestamp = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine flow state / streak tiers
  const isGodlike = streak >= 75;
  const isSupernova = streak >= 50 && !isGodlike;
  const isFever = streak >= 25 && !isSupernova && !isGodlike;
  const isFlow = streak >= 10 && !isFever && !isSupernova && !isGodlike;
  const hasStreak = streak > 0;

  const lineText = (activeLine.text || '').toLowerCase();

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative w-full cursor-text select-none py-4 sm:py-6 px-4 sm:px-8 rounded-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden ${
        !isPlaying
          ? 'border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.5)] bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 opacity-90'
          : isShaking
          ? 'animate-error-shake border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.4)] bg-rose-950/20'
          : isGodlike
          ? 'border-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.5)] animate-rainbow-border bg-gradient-to-b from-indigo-950/40 to-white/[0.02]'
          : isSupernova
          ? 'border-fuchsia-400/70 shadow-[0_0_35px_rgba(217,70,239,0.45)] bg-gradient-to-b from-fuchsia-950/30 to-white/[0.02]'
          : isFever
          ? 'border-amber-400/70 shadow-[0_0_30px_rgba(245,158,11,0.4)] bg-gradient-to-b from-amber-950/25 to-white/[0.02]'
          : isFlow
          ? 'border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.3)] bg-gradient-to-b from-cyan-950/20 to-white/[0.02]'
          : hasStreak
          ? 'border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-b from-amber-950/10 to-white/[0.02]'
          : 'border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.4)] bg-gradient-to-b from-white/[0.08] to-white/[0.02]'
      }`}
      tabIndex={0}
    >
      {/* Hidden input for mobile virtual keyboard */}
      <input
        ref={hiddenInputRef}
        type="text"
        aria-label="Input ketikan lirik lagu"
        disabled={!isPlaying}
        readOnly={!isPlaying}
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute bottom-8 text-xl font-bold animate-float-note drop-shadow-[0_0_12px_currentColor] ${p.color}`}
            style={{ left: `${p.leftPercent}%` }}
          >
            {p.symbol}
          </div>
        ))}
      </div>

      {/* Feedback Pop Badge */}
      {lineFeedback && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 animate-streak-pop">
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500 text-zinc-950 font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(251,191,36,0.7)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-zinc-950 shrink-0" />
            <span>{lineFeedback}</span>
          </div>
        </div>
      )}

      {/* PAUSED BANNER OVERLAY: Muncul saat video/lagu dihentikan / dijeda */}
      {!isPlaying && !isFinished && (
        <div className="absolute inset-0 z-40 bg-[#07090e]/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-semibold mb-2 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Pause className="w-3.5 h-3.5" />
            <span>Pemutaran Video / Lagu Dijeda · Ketikan Dinonaktifkan</span>
          </div>
          <p className="text-xs text-zinc-400 max-w-sm mb-3">
            Lagu sedang dijeda sehingga keyboard terkunci. Putar video kembali untuk melanjutkan ketikan lirik.
          </p>
          {onResumePlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResumePlay();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Lanjutkan Lagu (Play)</span>
            </button>
          )}
        </div>
      )}

      {/* Baris Informasi Atas: Frasa Lirik, Posisi Deteksi Vokal Musik & Status Kombo */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-zinc-400 tracking-wide text-[11px] sm:text-xs">
            Baris <strong className="text-white">{currentLineIndex + 1}</strong> / {totalLines}
          </span>
          {activeLine.timeSeconds > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 font-bold text-[10px]">
              {formatTimestamp(activeLine.timeSeconds)}
            </span>
          )}

          {/* Penanda Deteksi Posisi Vokal Lagu Otomatis */}
          {isPlaying && isAudioInLine && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
              <Mic className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              <span>Vokal Terdeteksi Sistem</span>
              <span className="text-zinc-500">·</span>
              <span className="text-white font-mono">{formatTimestamp(audioCurrentTime)}</span>
            </div>
          )}

          {!isPlaying && (
            <span className="hidden sm:inline-block text-[10px] text-amber-400/90 font-mono">
              (Lagu dihentikan)
            </span>
          )}
        </div>

        {/* Dynamic Multiplier Feedback Pill */}
        <div className="flex items-center gap-2">
          {isIntro && introSecondsLeft > 0 ? (
            <span className="px-2 py-0.5 rounded bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 font-bold text-[11px] flex items-center gap-1.5 animate-pulse">
              <Music2 className="w-3 h-3 text-cyan-400" />
              <span>Intro · Vokal Masuk dalam {introSecondsLeft}d</span>
            </span>
          ) : isGodlike ? (
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(244,63,94,0.8)] animate-pulse">
              <Crown className="w-3.5 h-3.5 fill-white text-white" />
              <span>GODLIKE x3.0</span>
            </span>
          ) : isSupernova ? (
            <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/30 border border-fuchsia-400/70 text-fuchsia-100 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(217,70,239,0.5)]">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>SUPERNOVA x2.5</span>
            </span>
          ) : isFever ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/70 text-amber-200 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-streak-fire">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>FEVER x2.0</span>
            </span>
          ) : isFlow ? (
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Zap className="w-3.5 h-3.5 fill-cyan-300 text-cyan-300" />
              <span>FLOW x1.5</span>
            </span>
          ) : (
            <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Ritme Otomatis Aktif</span>
            </span>
          )}
        </div>
      </div>

      {/* AREA MENGETIK LIRIK UTAMA */}
      <div className="min-h-[95px] sm:min-h-[115px] flex flex-col items-center justify-center py-4 text-center relative">
        {/* INDIKATOR KOMBO: Menyala terus menerus selama mengetik tanpa salah */}
        {hasStreak && !isIntro && isPlaying && (
          <div className="mb-3 flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-black transition-all animate-streak-fire ${
                isGodlike
                  ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.8)]'
                  : isSupernova
                  ? 'bg-fuchsia-500/30 border border-fuchsia-400/70 text-fuchsia-100 shadow-[0_0_20px_rgba(217,70,239,0.5)]'
                  : isFever
                  ? 'bg-amber-500/30 border border-amber-400/70 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
                  : isFlow
                  ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-amber-500/15 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-fire-flicker" />
              <span className="font-black tabular-nums text-sm">
                {streak}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                {isGodlike ? 'GODLIKE STREAK!' : isSupernova ? 'SUPERNOVA!' : isFever ? 'FEVER STREAK!' : isFlow ? 'FLOW STREAK' : 'STREAK BERUNTUN'}
              </span>
            </div>
          </div>
        )}

        {/* Huruf demi huruf lirik dengan Penanda Posisi Vokal yang dideteksi otomatis oleh sistem */}
        <div
          className={`w-full text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-relaxed sm:leading-snug transition-all duration-150 relative ${
            isTransitioning ? 'animate-line-out opacity-0' : 'animate-line-in opacity-100'
          }`}
        >
          {lineText.split('').map((char, idx) => {
            const isUserCurrent = idx === charIndexInLine && !isFinished && !isLineCompletedAhead && isPlaying;
            const isVocalCurrent = isAudioInLine && idx === vocalCharIndex;
            const typedChar = typedInLine[idx];

            let charColor = 'text-zinc-500/80 font-medium'; // Karakter belum diketik
            let charStyle: React.CSSProperties = {};

            if (typedChar !== null && typedChar !== undefined) {
              if (typedChar === char) {
                // Huruf yang berhasil diketik dengan benar
                charColor = 'text-white font-extrabold';
                charStyle = {
                  textShadow: isGodlike
                    ? '0 0 16px rgba(251,191,36,0.95), 0 0 30px rgba(244,63,94,0.7)'
                    : isFever
                    ? '0 0 14px rgba(245,158,11,0.9), 0 0 25px rgba(245,158,11,0.6)'
                    : '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(6,182,212,0.5)',
                };
              } else {
                // Kesalahan ketik
                charColor = 'text-rose-400 font-bold bg-rose-950/70 rounded px-0.5';
                charStyle = {
                  textDecoration: 'underline wavy #f43f5e 2px',
                  textUnderlineOffset: '5px',
                  textShadow: '0 0 10px rgba(244,63,94,0.8)',
                };
              }
            } else if (isUserCurrent) {
              // POSISI KETIKAN PEMAIN SAAT INI (Teks Shadow tebal berpendar)
              charColor = 'text-cyan-200 font-black animate-current-glow';
              charStyle = {
                textShadow: '0 0 12px rgba(6,182,212,1), 0 0 25px rgba(6,182,212,0.8), 0 0 40px rgba(34,211,238,0.5)',
              };
            } else if (isVocalCurrent && isPlaying) {
              // POSISI VOKAL MUSIK SAAT INI (Karakter yang sedang dinyanyikan di video/audio)
              charColor = 'text-amber-200 font-bold';
              charStyle = {
                textShadow: '0 0 10px rgba(251,191,36,0.9), 0 0 20px rgba(245,158,11,0.5)',
              };
            }

            return (
              <span
                key={idx}
                style={charStyle}
                className={`relative inline-block transition-all duration-75 ${charColor} ${
                  isUserCurrent ? 'scale-110 sm:scale-125 z-10' : ''
                }`}
              >
                {/* PENANDA POSISI LIRIK YANG DIDETEKSI OTOMATIS OLEH SISTEM (VOCAL MARKER) */}
                {isVocalCurrent && (
                  <span
                    className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                    title={`Posisi vokal terdeteksi otomatis: ${formatTimestamp(audioCurrentTime)}`}
                  >
                    <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-cyan-400 text-zinc-950 font-black text-[9px] uppercase tracking-wider shadow-[0_0_12px_rgba(251,191,36,0.9)] flex items-center gap-0.5 whitespace-nowrap">
                      <Mic className="w-2.5 h-2.5 fill-zinc-950" />
                      <span>VOKAL</span>
                    </span>
                    <span className="w-1.5 h-1.5 bg-amber-400 rotate-45 -mt-0.5 shadow-sm" />
                  </span>
                )}

                {/* Garis bawah penanda vokal otomatis di karakter yang sedang dinyanyikan */}
                {isVocalCurrent && (
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse"
                    aria-hidden="true"
                  />
                )}

                {/* Visual Caret Highlight & Shadow posisi ketikan pemain */}
                {isUserCurrent && (
                  <>
                    <span
                      className="absolute -inset-1 rounded-md bg-cyan-400/25 -z-10 blur-[4px] animate-pulse"
                      aria-hidden="true"
                    />
                    <span
                      className={`absolute -left-[3px] top-[5%] bottom-[5%] w-[3.5px] rounded-full animate-cursor-blink ${
                        isGodlike
                          ? 'bg-gradient-to-b from-amber-300 via-rose-400 to-indigo-400 shadow-[0_0_16px_rgba(251,191,36,1)]'
                          : isFever
                          ? 'bg-gradient-to-b from-amber-400 to-rose-400 shadow-[0_0_14px_rgba(245,158,11,1)]'
                          : 'bg-gradient-to-b from-cyan-400 to-amber-300 shadow-[0_0_12px_rgba(6,182,212,1)]'
                      }`}
                      aria-hidden="true"
                    />
                  </>
                )}
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>

        {/* Tanda baris selesai mendahului waktu lagu */}
        {isLineCompletedAhead && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kalimat selesai! Menunggu irama baris berikutnya...</span>
          </div>
        )}
      </div>

      {/* Baris Selanjutnya & Progress Bar Baris */}
      <div className="pt-2.5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400/80 font-medium truncate max-w-full">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 shrink-0 flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-cyan-400" />
            <span>Berikutnya ({nextLine ? formatTimestamp(nextLine.timeSeconds) : 'Selesai'}):</span>
          </span>
          {nextLine ? (
            <span className="truncate italic text-zinc-300">
              "{nextLine.text.toLowerCase()}"
            </span>
          ) : (
            <span className="text-zinc-500 italic">
              Baris penutup lagu!
            </span>
          )}
        </div>

        {/* Dual Progress: Progress Ketikan & Progress Audio Vokal */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isAudioInLine && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
              <span className="text-amber-400">Vokal:</span>
              <span className="tabular-nums">{Math.round(vocalProgress * 100)}%</span>
            </div>
          )}
          <div className="w-full sm:w-36 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0 relative">
            {/* Audio Vocal System Progress Bar (Amber/Cyan marker) */}
            {isAudioInLine && (
              <div
                className="absolute top-0 bottom-0 bg-amber-400/50 transition-all duration-75"
                style={{ width: `${Math.min(100, vocalProgress * 100)}%` }}
              />
            )}
            {/* User Typing Progress Bar */}
            <div
              className={`h-full rounded-full transition-all duration-100 relative z-10 ${
                isGodlike
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : isFever
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'bg-gradient-to-r from-cyan-400 to-amber-300'
              }`}
              style={{
                width: `${Math.min(100, (charIndexInLine / Math.max(1, lineText.length)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
