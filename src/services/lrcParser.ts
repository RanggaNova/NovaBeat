import { SyncedLyricLine } from '../types/song';
import { convertToRomaji } from './romajiConverter';
import { sanitizeLyricPunctuation } from './lyricsCleaner';

/**
 * Parses raw LRC timestamp text into structured SyncedLyricLine array
 * Strips symbols like (), :, ;, ?, !, ., keeping only commas (,) and hyphens (-)
 * Calibrates line durations so no line is too fast or creates awkward long pauses
 */
export function parseLrc(lrcText: string): SyncedLyricLine[] {
  if (!lrcText || !lrcText.trim()) return [];

  const rawLines = lrcText.split(/\r?\n/);
  const result: SyncedLyricLine[] = [];

  for (const raw of rawLines) {
    const match = raw.match(/\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const timeSeconds = minutes * 60 + seconds;
      let text = match[3]
        .replace(/^[♪♫#♩♬\s]+/, '')
        .replace(/[♪♫#♩♬\s]+$/, '');

      // Convert Japanese characters to standard QWERTY Latin Romaji
      text = convertToRomaji(text);

      // Strip symbols like (), :, ;, ?, !, ., keeping only commas (,) and hyphens (-)
      text = sanitizeLyricPunctuation(text);

      // Only add if there is actual text to type (skip pure instrumental lines)
      if (text.length > 0 && !/^\[.*\]$/.test(text) && text !== '♪') {
        result.push({
          id: result.length,
          timeSeconds: Math.round(timeSeconds * 100) / 100,
          endTimeSeconds: timeSeconds + 4, // placeholder, updated in second pass
          text: text.toLowerCase(),
        });
      }
    }
  }

  // Second pass: Calculate endTimeSeconds so each line matches the exact audio span
  // Line i ends when Line i+1 begins, preserving true vocal synchronicity
  for (let i = 0; i < result.length; i++) {
    if (i < result.length - 1) {
      result[i].endTimeSeconds = result[i + 1].timeSeconds;
    } else {
      // Final line
      const textLen = result[i].text.length;
      result[i].endTimeSeconds = result[i].timeSeconds + Math.max(4.0, Math.min(7.0, textLen * 0.15));
    }
  }

  return result;
}

/**
 * Fallback: Creates synthetic synced timestamps for plain lyrics
 * distributes lines across the total duration evenly
 */
export function generateSyntheticTiming(
  plainLyrics: string,
  totalDurationSeconds: number = 200
): SyncedLyricLine[] {
  const lines = plainLyrics
    .split(/\r?\n/)
    .map(l => sanitizeLyricPunctuation(l))
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  // Start lyrics after a standard 8-second intro
  const introDelay = 8;
  const availableTime = Math.max(30, totalDurationSeconds - introDelay - 10);
  const timePerLine = Math.max(4.5, availableTime / lines.length);

  return lines.map((rawText, idx) => {
    const text = sanitizeLyricPunctuation(convertToRomaji(rawText));
    const timeSeconds = Math.round((introDelay + idx * timePerLine) * 10) / 10;
    const endTimeSeconds = Math.round((timeSeconds + timePerLine) * 10) / 10;
    return {
      id: idx,
      timeSeconds,
      endTimeSeconds,
      text: text.toLowerCase(),
    };
  });
}
