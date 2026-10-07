import { useState, useEffect, useRef, useCallback } from 'react';
import { SyncedLyricLine, TypingStats } from '../types/song';
import { FloatingParticle } from './useRhythmTypingEngine';
import { audioSynthesizer } from '../services/audioService';
import { sanitizeLyricPunctuation } from '../services/lyricsCleaner';

export interface UseSyncedRhythmTypingEngineProps {
  syncedLines: SyncedLyricLine[];
  isPlaying?: boolean;
  onFinish?: (finalStats: TypingStats) => void;
}

export function useSyncedRhythmTypingEngine({
  syncedLines,
  isPlaying = false,
  onFinish,
}: UseSyncedRhythmTypingEngineProps) {
  const rawLines = syncedLines.length > 0 ? syncedLines : [
    { id: 0, timeSeconds: 0, endTimeSeconds: 5, text: 'no lyrics available' }
  ];
  // Convert all lyric sentences to strictly lowercase and sanitized punctuation
  const activeLines = rawLines.map(l => ({
    ...l,
    text: sanitizeLyricPunctuation(l.text),
  }));

  const totalCharacters = activeLines.reduce((acc, l) => acc + l.text.length, 0);

  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [charIndexInLine, setCharIndexInLine] = useState<number>(0);
  const [typedInLine, setTypedInLine] = useState<(string | null)[]>(() =>
    new Array(activeLines[0]?.text.length || 0).fill(null)
  );

  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [isLineCompletedAhead, setIsLineCompletedAhead] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [lineFeedback, setLineFeedback] = useState<string | null>(null);

  const [correctTotal, setCorrectTotal] = useState<number>(0);
  const [incorrectTotal, setIncorrectTotal] = useState<number>(0);
  const [errorsTotal, setErrorsTotal] = useState<number>(0);
  const [currentLineErrors, setCurrentLineErrors] = useState<number>(0);

  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  // Track latest state for event callbacks
  const stateRef = useRef({
    currentLineIndex,
    charIndexInLine,
    typedInLine,
    activeLines,
    correctTotal,
    incorrectTotal,
    errorsTotal,
    currentLineErrors,
    streak,
    highestStreak,
    startTime,
    isFinished,
    isTransitioning,
    isLineCompletedAhead,
    audioCurrentTime,
    isPlaying,
  });

  stateRef.current = {
    currentLineIndex,
    charIndexInLine,
    typedInLine,
    activeLines,
    correctTotal,
    incorrectTotal,
    errorsTotal,
    currentLineErrors,
    streak,
    highestStreak,
    startTime,
    isFinished,
    isTransitioning,
    isLineCompletedAhead,
    audioCurrentTime,
    isPlaying,
  };

  // Timer loop
  useEffect(() => {
    if (!startTime || isFinished || !isPlaying) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    }, 200);

    return () => clearInterval(interval);
  }, [startTime, isFinished, isPlaying]);

  // Spawns celebration particles on combos
  const spawnCelebrationParticle = useCallback((currentStreak: number) => {
    const symbols = currentStreak >= 30
      ? ['🔥', '⚡', '✨', '🌟', '♫']
      : currentStreak >= 15
      ? ['♫', '♪', '✨', '✦', '♬']
      : ['♪', '♫', '•', '✦'];

    const colors = [
      'text-amber-400',
      'text-pink-400',
      'text-cyan-400',
      'text-purple-400',
      'text-emerald-400',
    ];

    const newParticle: FloatingParticle = {
      id: `p_${Date.now()}_${Math.random()}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      leftPercent: 35 + Math.random() * 30,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setParticles(prev => [...prev.slice(-14), newParticle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1100);
  }, []);

  // Calculate live typing statistics
  const calculateStats = useCallback((): TypingStats => {
    const s = stateRef.current;
    const timeInSec = Math.max(1, s.startTime ? Math.floor((Date.now() - s.startTime) / 1000) : elapsedSeconds);
    const minutes = timeInSec / 60;

    const wpm = minutes > 0 ? Math.round((s.correctTotal / 5) / minutes) : 0;
    const totalTyped = s.correctTotal + s.incorrectTotal;
    const accuracy = totalTyped > 0 ? Math.round((s.correctTotal / totalTyped) * 1000) / 10 : 100;

    const progress = totalCharacters > 0
      ? Math.min(100, Math.round(((s.correctTotal) / totalCharacters) * 100))
      : 0;

    return {
      wpm,
      rawWpm: minutes > 0 ? Math.round(((totalTyped) / 5) / minutes) : 0,
      accuracy,
      correctCharacters: s.correctTotal,
      incorrectCharacters: s.incorrectTotal,
      errors: s.errorsTotal,
      streak: s.streak,
      highestStreak: s.highestStreak,
      progress,
      elapsedSeconds: timeInSec,
    };
  }, [elapsedSeconds, totalCharacters]);

  // Transition smoothly to target line
  const transitionToLine = useCallback((targetIndex: number) => {
    const s = stateRef.current;
    if (s.isFinished) return;

    if (targetIndex >= s.activeLines.length) {
      // Test completed!
      setIsFinished(true);
      const timeInSec = Math.max(1, s.startTime ? Math.floor((Date.now() - s.startTime) / 1000) : 1);
      const minutes = timeInSec / 60;
      const finalWpm = minutes > 0 ? Math.round((s.correctTotal / 5) / minutes) : 0;
      const finalTotal = s.correctTotal + s.incorrectTotal;
      const finalAcc = finalTotal > 0 ? Math.round((s.correctTotal / finalTotal) * 1000) / 10 : 100;

      const finalStats: TypingStats = {
        wpm: finalWpm,
        rawWpm: finalWpm,
        accuracy: finalAcc,
        correctCharacters: s.correctTotal,
        incorrectCharacters: s.incorrectTotal,
        errors: s.errorsTotal,
        streak: s.streak,
        highestStreak: s.highestStreak,
        progress: 100,
        elapsedSeconds: Math.floor((Date.now() - (s.startTime || Date.now())) / 1000),
      };

      if (onFinish) onFinish(finalStats);
      return;
    }

    // Instant synchronous line switch so text never lags behind audio
    setCurrentLineIndex(targetIndex);
    setCharIndexInLine(0);
    setTypedInLine(new Array(s.activeLines[targetIndex].text.length).fill(null));
    setCurrentLineErrors(0);
    setIsLineCompletedAhead(false);
    setIsTransitioning(false);
  }, [onFinish]);

  // Synchronize with audio player real-time timestamp
  const syncAudioTime = useCallback((currentTimeSeconds: number) => {
    const s = stateRef.current;
    if (s.isFinished || s.activeLines.length === 0) return;

    setAudioCurrentTime(currentTimeSeconds);

    // Start timer if not already started
    if (!s.startTime && currentTimeSeconds > 0) {
      setStartTime(Date.now() - Math.floor(currentTimeSeconds * 1000));
    }

    // Determine matched sentence index based on audio timestamp
    let matchedIndex = 0;
    if (currentTimeSeconds < s.activeLines[0].timeSeconds) {
      matchedIndex = 0;
    } else {
      for (let i = 0; i < s.activeLines.length; i++) {
        const line = s.activeLines[i];
        const nextLine = s.activeLines[i + 1];
        if (nextLine) {
          if (currentTimeSeconds >= line.timeSeconds && currentTimeSeconds < nextLine.timeSeconds) {
            matchedIndex = i;
            break;
          }
        } else {
          matchedIndex = i;
        }
      }
    }

    // If audio line index differs from current typing line index:
    if (matchedIndex !== s.currentLineIndex && !s.isTransitioning) {
      if (matchedIndex > s.currentLineIndex) {
        const currentLineText = s.activeLines[s.currentLineIndex]?.text || '';
        const missedCount = Math.max(0, currentLineText.length - s.charIndexInLine);

        // Only count as missed if not already completed ahead and misses more than 3 chars
        if (missedCount > 3 && !s.isLineCompletedAhead) {
          setIncorrectTotal(c => c + missedCount);
          setErrorsTotal(c => c + missedCount);
          setStreak(0);
        }
      }

      transitionToLine(matchedIndex);
    }
  }, [transitionToLine]);

  // Keystroke handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = stateRef.current;
    // CRITICAL REQUIREMENT: Block typing if audio/video is paused or stopped!
    if (!s.isPlaying || s.isFinished || s.isTransitioning) return;

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // If line completed ahead, pressing Space or Enter immediately advances to next line!
    if (s.isLineCompletedAhead) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        transitionToLine(s.currentLineIndex + 1);
      }
      return;
    }

    // Handle Backspace within current active sentence
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (s.charIndexInLine > 0) {
        const prevIdx = s.charIndexInLine - 1;
        const currentLineText = s.activeLines[s.currentLineIndex]?.text || '';
        const prevWasCorrect =
          s.typedInLine[prevIdx] === currentLineText[prevIdx] ||
          (s.typedInLine[prevIdx]?.toLowerCase() === currentLineText[prevIdx]?.toLowerCase());

        setTypedInLine(prev => {
          const next = [...prev];
          next[prevIdx] = null;
          return next;
        });

        setCharIndexInLine(prevIdx);
        if (prevWasCorrect) {
          setCorrectTotal(c => Math.max(0, c - 1));
        } else {
          setIncorrectTotal(c => Math.max(0, c - 1));
        }
      }
      return;
    }

    if (e.key.length > 1 && e.key !== 'Enter') return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }

    const currentLine = s.activeLines[s.currentLineIndex];
    if (!currentLine) return;

    const targetChar = currentLine.text[s.charIndexInLine];
    if (targetChar === undefined) return;

    // If user typed a stripped symbol, ignore it gracefully
    if ("':;?!.()[]{},-~_/\\*\"".includes(e.key) && targetChar !== e.key) {
      return;
    }

    // Start timer on first keystroke if not yet started
    if (!s.startTime) {
      setStartTime(Date.now());
    }

    const pressedKey = e.key === 'Enter' ? ' ' : e.key;
    const isCorrect = pressedKey.toLowerCase() === targetChar.toLowerCase();

    if (isCorrect) {
      // Keystroke correct
      audioSynthesizer.playKeyClick(s.charIndexInLine);

      setTypedInLine(prev => {
        const next = [...prev];
        next[s.charIndexInLine] = targetChar;
        return next;
      });

      setCorrectTotal(c => c + 1);

      setStreak(cur => {
        const next = cur + 1;
        setHighestStreak(h => Math.max(h, next));
        if (next > 0 && next % 10 === 0) {
          spawnCelebrationParticle(next);
          audioSynthesizer.playComboChime(next);
        }
        return next;
      });

      const nextCharIndex = s.charIndexInLine + 1;
      setCharIndexInLine(nextCharIndex);

      // Sentence fully typed
      if (nextCharIndex >= currentLine.text.length) {
        audioSynthesizer.playLineComplete();
        setIsLineCompletedAhead(true);

        const feedbackMsg = s.currentLineErrors === 0 ? '✨ Sempurna! (Perfect)' : '👍 Baris Selesai!';
        setLineFeedback(feedbackMsg);

        setTimeout(() => setLineFeedback(null), 1800);
      }
    } else {
      // Keystroke error
      audioSynthesizer.playErrorBeep();

      setTypedInLine(prev => {
        const next = [...prev];
        next[s.charIndexInLine] = pressedKey;
        return next;
      });

      setIncorrectTotal(c => c + 1);
      setErrorsTotal(c => c + 1);
      setCurrentLineErrors(eCount => eCount + 1);
      setStreak(0);

      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 240);

      const nextCharIndex = s.charIndexInLine + 1;
      setCharIndexInLine(nextCharIndex);

      if (nextCharIndex >= currentLine.text.length) {
        setIsLineCompletedAhead(true);
      }
    }
  }, [spawnCelebrationParticle, transitionToLine]);

  // Restart engine to beginning
  const restart = useCallback(() => {
    setCurrentLineIndex(0);
    setCharIndexInLine(0);
    setTypedInLine(new Array(activeLines[0]?.text.length || 0).fill(null));
    setIsLineCompletedAhead(false);
    setIsTransitioning(false);
    setLineFeedback(null);
    setCorrectTotal(0);
    setIncorrectTotal(0);
    setErrorsTotal(0);
    setCurrentLineErrors(0);
    setStreak(0);
    setHighestStreak(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setAudioCurrentTime(0);
    setIsFinished(false);
    setIsShaking(false);
    setParticles([]);
  }, [activeLines]);

  // Determine if currently waiting in the instrumental intro
  const firstLine = activeLines[0];
  const isIntro = firstLine ? audioCurrentTime < firstLine.timeSeconds : false;
  const introSecondsLeft = firstLine ? Math.max(0, Math.ceil(firstLine.timeSeconds - audioCurrentTime)) : 0;

  // Calculate system-detected vocal position within current active line
  const activeLine = activeLines[currentLineIndex] || { id: 0, timeSeconds: 0, endTimeSeconds: 5, text: '' };
  const lineStart = activeLine.timeSeconds;
  const lineEnd = activeLine.endTimeSeconds;
  const textLength = activeLine.text.length;
  const rawGap = Math.max(0.4, lineEnd - lineStart);

  // Balanced vocal phrase duration:
  // For normal gaps (<= 5.5s), singing takes up ~90% of the line window.
  // For long gaps (> 5.5s, e.g. instrumental solos), singing finishes at natural singing speed (~0.13s/char),
  // so the vocal marker does NOT crawl unnaturally slow through guitar/piano solos!
  let vocalPhraseDuration = rawGap * 0.90;
  if (rawGap > 5.5) {
    const naturalSingingDuration = Math.max(2.2, textLength * 0.13 + 0.6);
    vocalPhraseDuration = Math.min(rawGap - 0.4, naturalSingingDuration);
  }
  const vocalEndTime = lineStart + vocalPhraseDuration;

  let vocalProgress = 0;
  let isVocalSinging = false;
  if (audioCurrentTime < lineStart) {
    vocalProgress = 0;
    isVocalSinging = false;
  } else if (audioCurrentTime >= vocalEndTime) {
    vocalProgress = 1;
    isVocalSinging = false;
  } else {
    vocalProgress = Math.min(1, Math.max(0, (audioCurrentTime - lineStart) / vocalPhraseDuration));
    isVocalSinging = true;
  }

  const vocalCharIndex = textLength > 0
    ? Math.min(textLength - 1, Math.floor(vocalProgress * textLength))
    : 0;

  const isAudioInLine = !isIntro && audioCurrentTime >= lineStart && audioCurrentTime < lineEnd;

  return {
    currentLineIndex,
    totalLines: activeLines.length,
    activeLine,
    nextLine: activeLines[currentLineIndex + 1] || null,
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
    isPlaying,
    lineFeedback,
    particles,
    stats: calculateStats(),
    isStarted: startTime !== null,
    startTime,
    isFinished,
    isShaking,
    handleKeyDown,
    syncAudioTime,
    restart,
  };
}
