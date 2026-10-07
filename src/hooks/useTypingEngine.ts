import { useState, useEffect, useRef, useCallback } from 'react';
import { TypingStats } from '../types/song';
import { audioSynthesizer } from '../services/audioService';

export interface UseTypingEngineProps {
  targetText: string;
  onFinish?: (finalStats: TypingStats) => void;
}

export interface CharacterState {
  char: string;
  typedChar?: string;
  status: 'pending' | 'correct' | 'incorrect';
}

export function useTypingEngine({ targetText, onFinish }: UseTypingEngineProps) {
  // Normalize line endings
  const normalizedTarget = useRef<string>(targetText.replace(/\r\n/g, '\n')).current;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [typedHistory, setTypedHistory] = useState<(string | null)[]>(() =>
    new Array(normalizedTarget.length).fill(null)
  );

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [totalErrors, setTotalErrors] = useState<number>(0);

  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // References to keep latest values in timers and event handlers without re-subscribing
  const stateRef = useRef({
    currentIndex,
    typedHistory,
    correctCount,
    incorrectCount,
    totalErrors,
    streak,
    highestStreak,
    startTime,
    isFinished,
    targetText: normalizedTarget,
  });

  stateRef.current = {
    currentIndex,
    typedHistory,
    correctCount,
    incorrectCount,
    totalErrors,
    streak,
    highestStreak,
    startTime,
    isFinished,
    targetText: normalizedTarget,
  };

  // Timer loop
  useEffect(() => {
    if (!startTime || isFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 200);

    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // Handle shake reset
  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 220);
  }, []);

  // Calculate live stats
  const calculateCurrentStats = useCallback((): TypingStats => {
    const elapsedMinutes = Math.max(elapsedSeconds, 1) / 60;
    const wpm = elapsedSeconds > 0
      ? Math.round((correctCount / 5) / elapsedMinutes)
      : 0;

    const rawWpm = elapsedSeconds > 0
      ? Math.round(((correctCount + incorrectCount) / 5) / elapsedMinutes)
      : 0;

    const totalTyped = correctCount + incorrectCount;
    const accuracy = totalTyped > 0
      ? Math.round((correctCount / totalTyped) * 1000) / 10
      : 100;

    const progress = normalizedTarget.length > 0
      ? Math.min(100, Math.round((currentIndex / normalizedTarget.length) * 100))
      : 0;

    return {
      wpm: Math.max(0, wpm),
      rawWpm: Math.max(0, rawWpm),
      accuracy: Math.min(100, Math.max(0, accuracy)),
      correctCharacters: correctCount,
      incorrectCharacters: incorrectCount,
      errors: totalErrors,
      streak,
      highestStreak,
      progress,
      elapsedSeconds,
    };
  }, [
    correctCount,
    incorrectCount,
    totalErrors,
    streak,
    highestStreak,
    currentIndex,
    normalizedTarget.length,
    elapsedSeconds,
  ]);

  // Keydown handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const state = stateRef.current;
    if (state.isFinished) return;

    // Ignore modifier combinations
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Handle Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (state.currentIndex > 0) {
        const prevIndex = state.currentIndex - 1;
        const prevWasCorrect = state.typedHistory[prevIndex] === state.targetText[prevIndex];

        setTypedHistory(prev => {
          const next = [...prev];
          next[prevIndex] = null;
          return next;
        });

        setCurrentIndex(prevIndex);
        if (prevWasCorrect) {
          setCorrectCount(c => Math.max(0, c - 1));
        } else {
          setIncorrectCount(c => Math.max(0, c - 1));
        }
      }
      return;
    }

    // Ignore non-character keys
    if (e.key.length > 1 && e.key !== 'Enter') {
      return;
    }

    // Prevent default scrolling on space or enter
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }

    const targetChar = state.targetText[state.currentIndex];
    if (targetChar === undefined) return;

    // Start timer upon first keypress
    if (!state.startTime) {
      setStartTime(Date.now());
    }

    // Match logic:
    // If target is newline '\n', accept either 'Enter' or ' ' (space)
    let isMatch = false;
    let inputChar = e.key;

    if (targetChar === '\n') {
      if (e.key === 'Enter' || e.key === ' ') {
        isMatch = true;
        inputChar = '\n';
      }
    } else {
      isMatch = (e.key === targetChar);
    }

    if (isMatch) {
      // Correct keystroke
      audioSynthesizer.playKeypress();
      const newStreak = state.streak + 1;
      setStreak(newStreak);
      setHighestStreak(h => Math.max(h, newStreak));

      // Milestone audio feedback (every 25 streak)
      if (newStreak > 0 && newStreak % 25 === 0) {
        audioSynthesizer.playStreakMilestone();
      }

      setCorrectCount(c => c + 1);

      setTypedHistory(prev => {
        const next = [...prev];
        next[state.currentIndex] = inputChar;
        return next;
      });

      const nextIndex = state.currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Check if finished
      if (nextIndex >= state.targetText.length) {
        setIsFinished(true);
        audioSynthesizer.playVictory();

        const finalMinutes = Math.max((Date.now() - (state.startTime || Date.now())), 1000) / 60000;
        const finalWpm = Math.round(((state.correctCount + 1) / 5) / finalMinutes);
        const finalTotalTyped = state.correctCount + 1 + state.incorrectCount;
        const finalAcc = Math.round(((state.correctCount + 1) / finalTotalTyped) * 1000) / 10;

        const finalStats: TypingStats = {
          wpm: Math.max(0, finalWpm),
          rawWpm: Math.max(0, finalWpm),
          accuracy: finalAcc,
          correctCharacters: state.correctCount + 1,
          incorrectCharacters: state.incorrectCount,
          errors: state.totalErrors,
          streak: newStreak,
          highestStreak: Math.max(state.highestStreak, newStreak),
          progress: 100,
          elapsedSeconds: Math.floor((Date.now() - (state.startTime || Date.now())) / 1000),
        };

        if (onFinish) {
          onFinish(finalStats);
        }
      }
    } else {
      // Incorrect keystroke
      audioSynthesizer.playError();
      triggerShake();
      setStreak(0);
      setIncorrectCount(c => c + 1);
      setTotalErrors(err => err + 1);

      setTypedHistory(prev => {
        const next = [...prev];
        next[state.currentIndex] = inputChar;
        return next;
      });

      // Still advance forward so user isn't stuck
      const nextIndex = state.currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= state.targetText.length) {
        setIsFinished(true);
        audioSynthesizer.playVictory();

        const finalMinutes = Math.max((Date.now() - (state.startTime || Date.now())), 1000) / 60000;
        const finalWpm = Math.round((state.correctCount / 5) / finalMinutes);
        const finalTotalTyped = state.correctCount + state.incorrectCount + 1;
        const finalAcc = Math.round((state.correctCount / finalTotalTyped) * 1000) / 10;

        const finalStats: TypingStats = {
          wpm: Math.max(0, finalWpm),
          rawWpm: Math.max(0, finalWpm),
          accuracy: finalAcc,
          correctCharacters: state.correctCount,
          incorrectCharacters: state.incorrectCount + 1,
          errors: state.totalErrors + 1,
          streak: 0,
          highestStreak: state.highestStreak,
          progress: 100,
          elapsedSeconds: Math.floor((Date.now() - (state.startTime || Date.now())) / 1000),
        };

        if (onFinish) {
          onFinish(finalStats);
        }
      }
    }
  }, [normalizedTarget, onFinish, triggerShake]);

  // Restart function
  const restart = useCallback(() => {
    setCurrentIndex(0);
    setTypedHistory(new Array(normalizedTarget.length).fill(null));
    setCorrectCount(0);
    setIncorrectCount(0);
    setTotalErrors(0);
    setStreak(0);
    setHighestStreak(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setIsFinished(false);
    setIsShaking(false);
  }, [normalizedTarget.length]);

  return {
    currentIndex,
    typedHistory,
    stats: calculateCurrentStats(),
    isStarted: startTime !== null,
    startTime,
    isFinished,
    isShaking,
    handleKeyDown,
    restart,
  };
}
