import { useState, useEffect, useRef, useCallback } from 'react';
import { TypingStats } from '../types/song';
import { audioSynthesizer } from '../services/audioService';
import { sanitizeLyricPunctuation } from '../services/lyricsCleaner';

export interface FloatingParticle {
  id: string;
  symbol: string;
  color: string;
  leftPercent: number; // 0 to 100
}

export interface UseRhythmTypingEngineProps {
  lines: string[];
  onFinish?: (finalStats: TypingStats) => void;
}

export function useRhythmTypingEngine({ lines, onFinish }: UseRhythmTypingEngineProps) {
  // Normalize lines to ensure no empty rows and strip symbols including commas and hyphens
  const activeLines = lines
    .map(l => sanitizeLyricPunctuation(l))
    .filter(l => l.length > 0);
  const totalCharacters = activeLines.reduce((acc, l) => acc + l.length, 0);

  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [charIndexInLine, setCharIndexInLine] = useState<number>(0);
  const [typedInLine, setTypedInLine] = useState<(string | null)[]>(() =>
    new Array(activeLines[0]?.length || 0).fill(null)
  );

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

  // Floating entertainment particles for smooth typing
  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  // Ref for latest state in event callbacks
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
  };

  // Timer loop
  useEffect(() => {
    if (!startTime || isFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    }, 200);

    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // Spawn celebration particles during smooth flow
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
      color: colors[Math.floor(Math.random() * colors.length)],
      leftPercent: 15 + Math.random() * 70, // disperse nicely across the stage
    };

    setParticles(prev => [...prev.slice(-12), newParticle]);

    // Clean up particle after animation completes
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1100);
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 240);
  }, []);

  // Compute live stats
  const calculateStats = useCallback((): TypingStats => {
    const elapsedMinutes = Math.max(elapsedSeconds, 1) / 60;
    const wpm = elapsedSeconds > 0
      ? Math.round((correctTotal / 5) / elapsedMinutes)
      : 0;

    const rawWpm = elapsedSeconds > 0
      ? Math.round(((correctTotal + incorrectTotal) / 5) / elapsedMinutes)
      : 0;

    const totalTyped = correctTotal + incorrectTotal;
    const accuracy = totalTyped > 0
      ? Math.round((correctTotal / totalTyped) * 1000) / 10
      : 100;

    const progress = totalCharacters > 0
      ? Math.min(100, Math.round((correctTotal / totalCharacters) * 100))
      : 0;

    return {
      wpm: Math.max(0, wpm),
      rawWpm: Math.max(0, rawWpm),
      accuracy: Math.min(100, Math.max(0, accuracy)),
      correctCharacters: correctTotal,
      incorrectCharacters: incorrectTotal,
      errors: errorsTotal,
      streak,
      highestStreak,
      progress,
      elapsedSeconds,
    };
  }, [correctTotal, incorrectTotal, errorsTotal, streak, highestStreak, elapsedSeconds, totalCharacters]);

  // Transition to next lyric sentence
  const advanceToNextLine = useCallback(() => {
    const s = stateRef.current;
    const isLineFlawless = s.currentLineErrors === 0;

    // Show exciting feedback
    setLineFeedback(isLineFlawless ? 'PERFECT! ★' : 'GREAT! ♪');
    setTimeout(() => setLineFeedback(null), 900);

    // Particle burst on sentence completion
    for (let i = 0; i < 4; i++) {
      setTimeout(() => spawnCelebrationParticle(s.streak + 5), i * 60);
    }

    setIsTransitioning(true);

    setTimeout(() => {
      const nextLineIdx = s.currentLineIndex + 1;

      if (nextLineIdx >= s.activeLines.length) {
        // Song is completed!
        setIsFinished(true);
        audioSynthesizer.playVictory();

        const finalMinutes = Math.max((Date.now() - (s.startTime || Date.now())), 1000) / 60000;
        const finalWpm = Math.round((s.correctTotal / 5) / finalMinutes);
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
      } else {
        // Advance to next line
        setCurrentLineIndex(nextLineIdx);
        setCharIndexInLine(0);
        setTypedInLine(new Array(s.activeLines[nextLineIdx].length).fill(null));
        setCurrentLineErrors(0);
        setIsTransitioning(false);
      }
    }, 280); // transition fade duration
  }, [onFinish, spawnCelebrationParticle]);

  // Keystroke handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = stateRef.current;
    if (s.isFinished || s.isTransitioning) return;

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Handle Backspace within current sentence
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (s.charIndexInLine > 0) {
        const prevIdx = s.charIndexInLine - 1;
        const currentLineText = s.activeLines[s.currentLineIndex] || '';
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

    // Prevent default scrolling on space or enter
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }

    const currentLineText = s.activeLines[s.currentLineIndex];
    if (!currentLineText) return;

    const targetChar = currentLineText[s.charIndexInLine];
    if (targetChar === undefined) return;

    // Start timer upon first keypress
    if (!s.startTime) {
      setStartTime(Date.now());
    }

    // Match logic:
    // Follows the lyrics casing visually, but does not force the user to hold Shift
    // for capital letters at the beginning of every sentence!
    const isMatch = (
      e.key === targetChar ||
      e.key.toLowerCase() === targetChar.toLowerCase()
    );

    if (isMatch) {
      // Correct!
      audioSynthesizer.playKeypress();
      const newStreak = s.streak + 1;
      setStreak(newStreak);
      setHighestStreak(h => Math.max(h, newStreak));

      // Spawn entertainment particles when typing smoothly!
      if (newStreak >= 3) {
        spawnCelebrationParticle(newStreak);
      }

      if (newStreak > 0 && newStreak % 20 === 0) {
        audioSynthesizer.playStreakMilestone();
      }

      setCorrectTotal(c => c + 1);

      setTypedInLine(prev => {
        const next = [...prev];
        next[s.charIndexInLine] = targetChar;
        return next;
      });

      const nextCharIdx = s.charIndexInLine + 1;
      setCharIndexInLine(nextCharIdx);

      // If finished current sentence, advance to next lyric line!
      if (nextCharIdx >= currentLineText.length) {
        advanceToNextLine();
      }
    } else {
      // Error!
      audioSynthesizer.playError();
      triggerShake();
      setStreak(0);
      setIncorrectTotal(c => c + 1);
      setErrorsTotal(err => err + 1);
      setCurrentLineErrors(c => c + 1);

      setTypedInLine(prev => {
        const next = [...prev];
        next[s.charIndexInLine] = e.key;
        return next;
      });

      const nextCharIdx = s.charIndexInLine + 1;
      setCharIndexInLine(nextCharIdx);

      // Still advance forward even with mistake so user is never stuck
      if (nextCharIdx >= currentLineText.length) {
        advanceToNextLine();
      }
    }
  }, [advanceToNextLine, spawnCelebrationParticle, triggerShake]);

  // Restart
  const restart = useCallback(() => {
    setCurrentLineIndex(0);
    setCharIndexInLine(0);
    setTypedInLine(new Array(activeLines[0]?.length || 0).fill(null));
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
    setIsFinished(false);
    setIsShaking(false);
    setParticles([]);
  }, [activeLines]);

  return {
    currentLineIndex,
    totalLines: activeLines.length,
    activeLineText: activeLines[currentLineIndex] || '',
    nextLineText: activeLines[currentLineIndex + 1] || null,
    charIndexInLine,
    typedInLine,
    isTransitioning,
    lineFeedback,
    particles,
    stats: calculateStats(),
    isStarted: startTime !== null,
    startTime,
    isFinished,
    isShaking,
    handleKeyDown,
    restart,
  };
}
