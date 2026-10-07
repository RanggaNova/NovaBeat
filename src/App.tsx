/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode, Song, SongWithLyrics, TypingStats as StatsType, LyricLengthMode } from './types/song';
import { CURATED_SONGS } from './services/curatedSongs';
import { defaultSongProvider } from './services/songProvider';
import { useSyncedRhythmTypingEngine } from './hooks/useSyncedRhythmTypingEngine';
import { audioSynthesizer } from './services/audioService';
import { saveHistoryItem, getSoundPreference, setSoundPreference } from './services/storageService';

// View Components
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { SongSelector } from './components/SongSelector';
import { FullAudioPlayer, FullAudioPlayerHandle } from './components/FullAudioPlayer';
import { TypingStats } from './components/TypingStats';
import { RhythmTypingArea } from './components/RhythmTypingArea';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';

// Icons
import { ArrowLeft, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View state
  const [view, setView] = useState<ViewMode>('HOME');

  // Currently loaded song
  const [selectedSong, setSelectedSong] = useState<SongWithLyrics>(CURATED_SONGS[0]);
  const [isLyricsLoading, setIsLyricsLoading] = useState<boolean>(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  // Audio Playback state
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const playerRef = React.useRef<FullAudioPlayerHandle>(null);

  // Sound effects state
  const [soundEnabled, setSoundState] = useState<boolean>(getSoundPreference());

  // Result stats cache
  const [lastStats, setLastStats] = useState<StatsType | null>(null);

  // Synced lines — always full song lyrics
  const activeSyncedLines = useMemo(() => {
    return selectedSong.syncedLines && selectedSong.syncedLines.length > 0
      ? selectedSong.syncedLines
      : [];
  }, [selectedSong]);

  // Finish callback
  const handleFinish = useCallback((finalStats: StatsType) => {
    setLastStats(finalStats);
    saveHistoryItem({
      songTitle: selectedSong.title,
      artist: selectedSong.artist,
      cover: selectedSong.cover,
      wpm: finalStats.wpm,
      accuracy: finalStats.accuracy,
      errors: finalStats.errors,
      highestStreak: finalStats.highestStreak,
      duration: finalStats.elapsedSeconds,
    });
    setIsGameStarted(false);
    setView('RESULT');
  }, [selectedSong]);

  // Synchronized vocal rhythm typing engine
  const {
    currentLineIndex,
    totalLines,
    activeLine,
    nextLine,
    charIndexInLine,
    typedInLine,
    isTransitioning,
    isLineCompletedAhead,
    isIntro,
    introSecondsLeft,
    audioCurrentTime,
    vocalProgress,
    vocalCharIndex,
    isVocalSinging,
    isAudioInLine,
    lineFeedback,
    particles,
    stats,
    isFinished,
    isShaking,
    handleKeyDown,
    syncAudioTime,
    restart,
  } = useSyncedRhythmTypingEngine({
    syncedLines: activeSyncedLines,
    isPlaying: isAudioPlaying,
    onFinish: handleFinish,
  });

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundState(next);
    setSoundPreference(next);
    audioSynthesizer.setEnabled(next);
  };

  // Select song from catalog
  const handleSelectSong = async (song: Song, _mode: LyricLengthMode = 'FULL') => {
    setIsLyricsLoading(true);
    setLyricsError(null);
    setIsGameStarted(false);
    setIsAudioPlaying(false);

    try {
      const fullSong = await defaultSongProvider.loadSongWithLyrics(song);
      setSelectedSong(fullSong);
      setIsLyricsLoading(false);
      restart();
      setView('TYPING');
    } catch (err: unknown) {
      setIsLyricsLoading(false);
      const msg = err instanceof Error ? err.message : 'Gagal memuat lirik. Silakan coba lagu lain.';
      setLyricsError(msg);
    }
  };

  // Reset test shortcut (Esc or Tab)
  useEffect(() => {
    const handleQuickReset = (e: KeyboardEvent) => {
      if (view === 'TYPING' && (e.key === 'Escape' || (e.key === 'Tab' && !e.shiftKey))) {
        e.preventDefault();
        restart();
        setIsGameStarted(false);
        setIsAudioPlaying(false);
        playerRef.current?.pause();
      }
    };

    window.addEventListener('keydown', handleQuickReset);
    return () => window.removeEventListener('keydown', handleQuickReset);
  }, [view, restart]);

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-zinc-950 relative overflow-x-hidden">
      {/* Background Animated Atmosphere (Samar-samar dan Halus) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Subtle Vinyl Grooves Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating Gradient Orbs — Bergerak perlahan dan samar */}
        <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-indigo-600/12 rounded-full blur-[140px] animate-ambient-slow" />
        <div className="absolute bottom-[5%] right-[-10%] w-[580px] h-[580px] bg-cyan-500/10 rounded-full blur-[130px] animate-ambient-reverse" />
        <div className="absolute top-[35%] left-[25%] w-[480px] h-[480px] bg-rose-500/8 rounded-full blur-[130px] animate-ambient-slow" />
        <div className="absolute top-[60%] left-[65%] w-[420px] h-[420px] bg-amber-500/8 rounded-full blur-[120px] animate-ambient-reverse" />

        {/* Equalizer Spectrum Bars samar di bagian bawah */}
        <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-between px-4 sm:px-12 opacity-10 overflow-hidden">
          {[45, 60, 30, 80, 55, 90, 40, 75, 65, 35, 85, 50, 70, 95, 45, 60, 85, 40, 75, 55, 65, 80, 45, 90].map((baseHeight, i) => (
            <div
              key={i}
              className="w-1.5 sm:w-2 rounded-t-full bg-gradient-to-t from-cyan-500 via-amber-400 to-rose-500"
              style={{
                height: `${baseHeight}%`,
                animation: `bg-equalizer ${1.6 + (i % 6) * 0.4}s ease-in-out infinite alternate`,
                animationDelay: `${(i % 8) * 0.25}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <Header
        currentView={view}
        onNavigate={(newView) => {
          if (newView === 'TYPING' && view !== 'TYPING') {
            restart();
            setIsGameStarted(false);
          }
          setView(newView);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onRestart={() => {
          restart();
          setIsGameStarted(false);
        }}
        showRestart={view === 'TYPING'}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto px-3 sm:px-6 flex flex-col justify-center ${view === 'TYPING' ? 'max-w-6xl py-2 sm:py-3.5' : 'max-w-5xl py-6 sm:py-10'}`}>
        {/* VIEW 1: HOME */}
        {view === 'HOME' && (
          <HomeView
            onStartTyping={() => {
              restart();
              setIsGameStarted(false);
              setView('TYPING');
            }}
            onChooseSong={() => setView('SONGS')}
            onViewHistory={() => setView('HISTORY')}
            featuredSong={CURATED_SONGS[0]}
          />
        )}

        {/* VIEW 2: SONG SELECTION */}
        {view === 'SONGS' && (
          <div className="w-full">
            {isLyricsLoading ? (
              <div className="py-24 text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                <div className="text-zinc-300 font-mono text-sm">
                  Menyiapkan sinkronisasi vokal & video YouTube...
                </div>
              </div>
            ) : (
              <>
                {lyricsError && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{lyricsError}</span>
                  </div>
                )}
                <SongSelector
                  onSelectSong={handleSelectSong}
                  selectedSongId={selectedSong.id}
                />
              </>
            )}
          </div>
        )}

        {/* VIEW 3: SYNCHRONIZED RHYTHM TYPING STAGE */}
        {view === 'TYPING' && (
          <div className="w-full space-y-3 sm:space-y-3.5 animate-in fade-in duration-200">
            {/* Top controls: Back to catalog & Restart */}
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
              <button
                onClick={() => {
                  setIsGameStarted(false);
                  setView('SONGS');
                }}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ganti Lagu</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-zinc-500">
                  Tekan <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-300">Esc</kbd> atau <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-300">Tab</kbd> untuk mengulang
                </span>
                <button
                  onClick={() => {
                    restart();
                    setIsGameStarted(false);
                  }}
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi (0:00)</span>
                </button>
              </div>
            </div>

            {/* TOP ROW: Video (Left) + Typing Speed & Live Stats (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-3.5 items-stretch">
              {/* TOP LEFT: Compact YouTube Video Player */}
              <div className="md:col-span-5 lg:col-span-5 flex flex-col">
                <FullAudioPlayer
                  ref={playerRef}
                  song={selectedSong}
                  onTimeUpdate={syncAudioTime}
                  onPlayStateChange={setIsAudioPlaying}
                  isGameStarted={isGameStarted}
                  onStartTrack={() => setIsGameStarted(true)}
                  onRestartTrack={() => {
                    restart();
                    setIsGameStarted(false);
                  }}
                />
              </div>

              {/* TOP RIGHT: Typing Speed & Song Stats Dashboard (2 Kolom x 2 Baris) */}
              <div className="md:col-span-7 lg:col-span-7 flex flex-col">
                <TypingStats
                  stats={stats}
                  song={selectedSong}
                  title={selectedSong.title}
                  artist={selectedSong.artist}
                  currentLineIndex={currentLineIndex}
                  totalLines={totalLines}
                  isGameStarted={isGameStarted}
                  onStartTrack={() => setIsGameStarted(true)}
                  onRestartTrack={() => {
                    restart();
                    setIsGameStarted(false);
                  }}
                />
              </div>
            </div>

            {/* BOTTOM ROW: Synced Sentence Rhythm Typing Section dengan Penanda Posisi Vokal Otomatis */}
            <div className="w-full">
              <RhythmTypingArea
                activeLine={activeLine}
                nextLine={nextLine}
                currentLineIndex={currentLineIndex}
                totalLines={totalLines}
                charIndexInLine={charIndexInLine}
                typedInLine={typedInLine}
                isTransitioning={isTransitioning}
                isLineCompletedAhead={isLineCompletedAhead}
                isIntro={isIntro}
                introSecondsLeft={introSecondsLeft}
                audioCurrentTime={audioCurrentTime}
                vocalProgress={vocalProgress}
                vocalCharIndex={vocalCharIndex}
                isVocalSinging={isVocalSinging}
                isAudioInLine={isAudioInLine}
                isPlaying={isAudioPlaying}
                onResumePlay={() => {
                  if (!isGameStarted) {
                    setIsGameStarted(true);
                  }
                  playerRef.current?.play();
                }}
                lineFeedback={lineFeedback}
                particles={particles}
                isShaking={isShaking}
                streak={stats.streak}
                onKeyDown={(e) => {
                  // Strictly disallow typing when video/audio is stopped or paused!
                  if (!isAudioPlaying) {
                    return;
                  }
                  handleKeyDown(e);
                }}
                isFinished={isFinished}
              />
            </div>

            {/* Overall Track Progress Bar */}
            <div className="space-y-1 px-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>
                    Progres Lagu: <strong className="text-white">{stats.progress}%</strong>
                  </span>
                </div>
                <span>
                  Baris {currentLineIndex + 1} / {totalLines}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 transition-all duration-300 rounded-full"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: TEST RESULTS */}
        {view === 'RESULT' && lastStats && (
          <ResultView
            song={selectedSong}
            stats={lastStats}
            onTryAgain={() => {
              restart();
              setIsGameStarted(false);
              setView('TYPING');
            }}
            onChooseAnotherSong={() => setView('SONGS')}
            onViewHistory={() => setView('HISTORY')}
          />
        )}

        {/* VIEW 5: USER HISTORY */}
        {view === 'HISTORY' && (
          <HistoryView
            onBackToTyping={() => setView('HOME')}
            onPlaySongAgain={(songTitle: string) => {
              const matched = CURATED_SONGS.find(s => s.title.toLowerCase().includes(songTitle.toLowerCase()));
              if (matched) {
                handleSelectSong(matched, 'FULL');
              } else {
                setView('SONGS');
              }
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-white/5 text-center text-xs font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Nova beat · Game Mengetik Ritme Vokal</span>
        </div>
        <div>
          <span>Semua audio dan video disinkronkan secara real-time</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
