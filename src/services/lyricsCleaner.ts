import { LyricLengthMode } from '../types/song';
import { hasJapaneseCharacters, kanaToQwertyRomaji, normalizeRomajiToQwerty } from './japaneseRomanizer';

/**
 * Strips symbols like (), :, ;, ?, !, ., quotes, brackets, as well as commas (,) and hyphens/dashes (-).
 * PRESERVES ONLY:
 * - lowercase letters (a-z)
 * - numbers (0-9)
 * - spaces
 */
export function sanitizeLyricPunctuation(str: string): string {
  if (!str) return '';

  return str
    // Remove content inside parentheses if they are labels like (chorus), (intro), (repeat)
    .replace(/\((?:chorus|verse|intro|outro|bridge|hook|repeat|solo)[^)]*\)/gi, '')
    // Remove all parentheses (), brackets [], braces {}, angle brackets <>
    .replace(/[()[\]{}<>]/g, ' ')
    // Remove colons :, semicolons ;, question marks ?, exclamation marks !, periods .
    .replace(/[:;?!.]/g, ' ')
    // Remove commas (,) and hyphens/dashes (-) as requested
    .replace(/[,-]/g, ' ')
    // Remove en-dash, em-dash, tilde, underscores
    .replace(/[\u2013\u2014~_]/g, ' ')
    // Remove quotes, backticks, slashes, and special symbols
    .replace(/["'`*&^%$#@/\\|+=]/g, '')
    // Remove curly quotes and apostrophes (e.g. i've -> ive, don't -> dont for smooth typing)
    .replace(/[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F']/g, '')
    // Clean multiple spaces and trim to single spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Normalizes lyric strings:
 * - converts Japanese characters / Romaji diacritics to 100% QWERTY ASCII
 * - strips all symbols including (), :, ;, ?, !, ., commas (,), and hyphens (-)
 * - trims excessive blank lines and spaces
 * - strictly lowercase
 */
export function cleanLyrics(raw: string): string {
  if (!raw) return '';

  let cleaned = raw
    // Remove music notes
    .replace(/[♪♫#♩♬]/g, '')
    // Remove metadata brackets like [Verse 1], [Chorus], [Bridge], [Intro], [Outro]
    .replace(/\[(?:Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Hook|Interlude|Solo|Guitar Solo|Drop|Refrain)[^\]]*\]/gi, '')
    // Remove empty parenthetical tags like (Instrumental)
    .replace(/\((?:Instrumental|Guitar Solo|Drum Solo|Beat Drop)[^)]*\)/gi, '');

  // If Japanese kana characters remain, convert them to standard QWERTY Romaji
  if (hasJapaneseCharacters(cleaned)) {
    cleaned = kanaToQwertyRomaji(cleaned);
  }

  // Ensure all diacritics (macrons like ō, ū) and Japanese full-width punctuation are clean QWERTY ASCII
  cleaned = normalizeRomajiToQwerty(cleaned);

  // Split into lines, sanitize all punctuation, and convert to lowercase
  const lines = cleaned
    .split(/\r?\n/)
    .map(line => sanitizeLyricPunctuation(line))
    .filter(line => line.length > 0);

  return lines.join('\n');
}

/**
 * Slices cleaned lyrics based on selected length mode
 */
export function formatLyricsByMode(cleanedLyrics: string, mode: LyricLengthMode = 'FULL'): string {
  const lines = cleanedLyrics.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return '';

  if (mode === 'QUICK') {
    return lines.slice(0, Math.min(5, lines.length)).join('\n');
  }

  if (mode === 'CHORUS') {
    return lines.slice(0, Math.min(12, lines.length)).join('\n');
  }

  return lines.join('\n');
}

/**
 * Splits text into lines and characters for typing engine
 */
export function prepareLyricsLines(lyricsText: string): string[] {
  return lyricsText
    .split('\n')
    .map(l => sanitizeLyricPunctuation(l))
    .filter(l => l.length > 0);
}
