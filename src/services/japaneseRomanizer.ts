import * as wanakana from 'wanakana';

/**
 * Checks if a string contains Japanese characters (Kanji, Hiragana, Katakana, full-width kana)
 */
export function hasJapaneseCharacters(text: string): boolean {
  if (!text) return false;
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

/**
 * Normalizes Romanized Japanese text to standard 100% QWERTY ASCII characters:
 * - Strips macrons/diacritics (e.g., ō -> o, ū -> u, ā -> a, ī -> i, ē -> e)
 * - Converts full-width Japanese punctuation to standard ASCII QWERTY
 * - Cleans multiple spaces
 */
export function normalizeRomajiToQwerty(str: string): string {
  if (!str) return '';

  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove macrons/diacritics
    .replace(/[()[\]{}<>:;?!"`~*^%$#@/\\|+=.]/g, '')
    .replace(/[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F']/g, '')
    .replace(/[、，]/g, ', ')
    .replace(/[〜～]/g, '-')
    .replace(/[　]/g, ' ') // full-width space to standard space
    .replace(/[^\x20-\x7E\n]/g, '') // strip any non-ASCII characters
    .replace(/ +/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Converts Japanese Kana (Hiragana and Katakana) directly to standard QWERTY Romaji.
 */
export function kanaToQwertyRomaji(kanaText: string): string {
  if (!kanaText) return '';
  const romaji = wanakana.toRomaji(kanaText);
  return normalizeRomajiToQwerty(romaji);
}

/**
 * Full Romanizer that handles mixed Kanji + Kana:
 * First attempts server-side / public transliteration for accurate Kanji readings,
 * then falls back to Wanakana for Kana to ensure 100% QWERTY compatibility.
 */
export async function romanizeJapaneseToQwerty(text: string): Promise<string> {
  if (!hasJapaneseCharacters(text)) {
    return text;
  }

  try {
    const res = await fetch(`/api/lyrics/romanize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.romaji) {
        return normalizeRomajiToQwerty(data.romaji);
      }
    }
  } catch {
    // If network fails, use client-side Wanakana fallback
  }

  // Client-side fallback using wanakana
  return kanaToQwertyRomaji(text);
}

/**
 * Romanizes full LRC lyrics while preserving precise timestamps [mm:ss.xx]
 */
export async function romanizeLrcLyrics(lrcContent: string): Promise<string> {
  if (!hasJapaneseCharacters(lrcContent)) {
    return lrcContent;
  }

  try {
    const res = await fetch(`/api/lyrics/romanize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lrc: lrcContent }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.romajiLrc) {
        return data.romajiLrc;
      }
    }
  } catch {
    // Continue with line-by-line fallback
  }

  // Fallback: parse lines and convert kana with wanakana
  const lines = lrcContent.split('\n');
  const converted = lines.map(line => {
    const match = line.match(/^(\[\d{2}:\d{2}(?:\.\d{2,3})?\])(.*)$/);
    if (match) {
      const tag = match[1];
      const text = match[2];
      return `${tag} ${kanaToQwertyRomaji(text)}`;
    }
    return kanaToQwertyRomaji(line);
  });

  return converted.join('\n');
}
