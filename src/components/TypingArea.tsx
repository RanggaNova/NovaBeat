import React, { useRef, useEffect } from 'react';
import { CornerDownLeft } from 'lucide-react';

interface TypingAreaProps {
  targetText: string;
  currentIndex: number;
  typedHistory: (string | null)[];
  isShaking: boolean;
  onKeyDown: (e: KeyboardEvent) => void;
  isFinished: boolean;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  targetText,
  currentIndex,
  typedHistory,
  isShaking,
  onKeyDown,
  isFinished,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Split lyrics into lines with absolute character indices
  const lines = React.useMemo(() => {
    const rawLines = targetText.split('\n');
    let runningIndex = 0;
    return rawLines.map((lineText, lineIdx) => {
      const lineStart = runningIndex;
      const chars = lineText.split('').map((char, charIdx) => ({
        char,
        globalIndex: lineStart + charIdx,
      }));

      // Account for the newline character at the end of the line (except last line)
      const hasNewline = lineIdx < rawLines.length - 1;
      const newlineIndex = lineStart + lineText.length;
      runningIndex = lineStart + lineText.length + (hasNewline ? 1 : 0);

      return {
        lineIndex: lineIdx,
        text: lineText,
        chars,
        startIndex: lineStart,
        hasNewline,
        newlineIndex,
      };
    });
  }, [targetText]);

  // Determine current active line
  const activeLineIndex = React.useMemo(() => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const end = line.startIndex + line.text.length + (line.hasNewline ? 1 : 0);
      if (currentIndex >= line.startIndex && currentIndex < end) {
        return i;
      }
    }
    return lines.length - 1;
  }, [lines, currentIndex]);

  // Smooth scroll container to keep active line centered
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  // Keyboard listener on window
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a search bar or modal input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target !== hiddenInputRef.current) {
        return;
      }

      onKeyDown(e);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onKeyDown]);

  // Keep focus on container
  const handleContainerClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative w-full cursor-text select-none py-4 px-2 sm:px-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 focus:outline-none focus:border-amber-500/30 transition-all ${
        isShaking ? 'animate-error-shake border-red-500/50' : ''
      }`}
      tabIndex={0}
    >
      {/* Hidden input for mobile keyboard activation */}
      <input
        ref={hiddenInputRef}
        type="text"
        aria-label="Typing input capture"
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Lyrics lines viewport */}
      <div className="max-h-[360px] overflow-y-auto overflow-x-hidden space-y-4 py-8 font-mono text-xl sm:text-2xl leading-relaxed tracking-wide scroll-smooth">
        {lines.map((line) => {
          const isActive = line.lineIndex === activeLineIndex;
          const isPast = line.lineIndex < activeLineIndex;

          return (
            <div
              key={line.lineIndex}
              ref={isActive ? activeLineRef : null}
              className={`flex flex-wrap items-center transition-all duration-200 ${
                isActive
                  ? 'opacity-100 text-zinc-100'
                  : isPast
                  ? 'opacity-35 text-zinc-500'
                  : 'opacity-60 text-zinc-400'
              }`}
            >
              {line.chars.map(({ char, globalIndex }) => {
                const isCurrent = globalIndex === currentIndex && !isFinished;
                const typedChar = typedHistory[globalIndex];

                let charColorClass = 'text-zinc-500'; // pending
                let underlineClass = '';

                if (typedChar !== null && typedChar !== undefined) {
                  if (typedChar === char) {
                    charColorClass = 'text-zinc-100 font-medium'; // correct
                  } else {
                    charColorClass = 'text-red-400 bg-red-950/40 rounded-xs font-semibold'; // incorrect
                    underlineClass = 'underline decoration-red-500 underline-offset-4';
                  }
                }

                return (
                  <span
                    key={globalIndex}
                    className={`relative inline-block transition-colors duration-75 ${charColorClass} ${underlineClass}`}
                  >
                    {/* Active Caret */}
                    {isCurrent && (
                      <span
                        className="absolute -left-[1px] top-[10%] bottom-[10%] w-[2.5px] bg-amber-400 animate-cursor-blink rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                        aria-hidden="true"
                      />
                    )}
                    {/* Render space as visible non-breaking width */}
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                );
              })}

              {/* End of line newline indicator */}
              {line.hasNewline && (
                <span
                  className={`inline-flex items-center ml-2 text-xs transition-colors ${
                    line.newlineIndex === currentIndex
                      ? 'text-amber-400 font-bold'
                      : typedHistory[line.newlineIndex] !== null && typedHistory[line.newlineIndex] !== undefined
                      ? 'text-zinc-600'
                      : 'text-zinc-600'
                  }`}
                  title="Press Space or Enter to continue"
                >
                  {line.newlineIndex === currentIndex && (
                    <span
                      className="inline-block w-[2px] h-4 bg-amber-400 animate-cursor-blink mr-1"
                      aria-hidden="true"
                    />
                  )}
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-60" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="pt-4 border-t border-zinc-800/40 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span>Click anywhere or start typing</span>
          <span>·</span>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700/60 rounded text-zinc-400">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700/60 rounded text-zinc-400">↵</kbd> for new line</span>
        </div>
        <div className="hidden sm:block">
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700/60 rounded text-zinc-400">Backspace</kbd> to edit</span>
        </div>
      </div>
    </div>
  );
};
