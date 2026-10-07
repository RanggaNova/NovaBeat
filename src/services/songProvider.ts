import { Song, SongWithLyrics, SyncedLyricLine } from '../types/song';
import { CURATED_SONGS } from './curatedSongs';
import { cleanLyrics } from './lyricsCleaner';
import { parseLrc, generateSyntheticTiming } from './lrcParser';
import { hasJapaneseCharacters, romanizeLrcLyrics, normalizeRomajiToQwerty } from './japaneseRomanizer';

export interface ISongSearchService {
  search(query: string): Promise<Song[]>;
  getPopular(): Promise<Song[]>;
}

export interface ISongMetadataService {
  getMetadata(id: string): Promise<Song | null>;
}

export interface ILyricsRetrievalService {
  getLyrics(song: Song): Promise<{ plainLyrics: string; syncedLyrics?: string } | null>;
}

/**
 * Backend API Provider (routes through /api/...)
 */
export class ApiSongSearchService implements ISongSearchService {
  async search(query: string): Promise<Song[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.getPopular();

    try {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback to local curated search
    }

    // Local fallback matching
    const q = trimmed.toLowerCase();
    const matchedCurated = CURATED_SONGS.filter(
      s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    ).map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      cover: s.cover,
      duration: s.duration,
      source: s.source,
      hasLyrics: true,
      youtubeId: s.youtubeId,
      previewUrl: s.previewUrl,
    }));

    return matchedCurated;
  }

  async getPopular(): Promise<Song[]> {
    try {
      const res = await fetch('/api/songs/popular');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Return curated fallback
    }

    return CURATED_SONGS.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      cover: s.cover,
      duration: s.duration,
      source: s.source,
      hasLyrics: true,
      youtubeId: s.youtubeId,
      previewUrl: s.previewUrl,
    }));
  }
}

export class ApiLyricsRetrievalService implements ILyricsRetrievalService {
  async getLyrics(song: Song): Promise<{ plainLyrics: string; syncedLyrics?: string } | null> {
    // 1. Check curated catalog first for immediate match
    const curated = CURATED_SONGS.find(
      s => s.id === song.id || (s.title.toLowerCase() === song.title.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase())
    );
    if (curated && curated.lyrics) {
      return {
        plainLyrics: cleanLyrics(curated.lyrics),
        syncedLyrics: curated.syncedLyrics,
      };
    }

    // 2. Fetch from backend API proxy
    try {
      const params = new URLSearchParams({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: String(song.duration || 0),
      });

      const res = await fetch(`/api/lyrics?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Lyrics API responded with status ${res.status}`);
      }
      const data = await res.json();
      if (data && data.lyrics) {
        return {
          plainLyrics: cleanLyrics(data.lyrics),
          syncedLyrics: data.syncedLyrics,
        };
      }
    } catch (err) {
      console.warn('Backend lyrics fetch error:', err);
    }

    return null;
  }
}

/**
 * High-level unified Song Provider
 */
export class SongProvider {
  private searchService: ISongSearchService;
  private lyricsService: ILyricsRetrievalService;

  constructor(
    searchService: ISongSearchService = new ApiSongSearchService(),
    lyricsService: ILyricsRetrievalService = new ApiLyricsRetrievalService()
  ) {
    this.searchService = searchService;
    this.lyricsService = lyricsService;
  }

  async searchSongs(query: string): Promise<Song[]> {
    return this.searchService.search(query);
  }

  async getPopularSongs(): Promise<Song[]> {
    return this.searchService.getPopular();
  }

  async loadSongWithLyrics(song: Song): Promise<SongWithLyrics> {
    const curatedMatch = CURATED_SONGS.find(
      c => c.id === song.id || (c.title.toLowerCase() === song.title.toLowerCase() && c.artist.toLowerCase() === song.artist.toLowerCase())
    );

    if (curatedMatch && curatedMatch.syncedLines && curatedMatch.syncedLines.length > 0) {
      return curatedMatch;
    }

    // 1. If youtubeId is missing, resolve official audio track starting at 0:00
    let youtubeId = song.youtubeId || curatedMatch?.youtubeId;
    if (!youtubeId) {
      try {
        const audioRes = await fetch(`/api/audio/resolve?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          if (audioData.youtubeId) {
            youtubeId = audioData.youtubeId;
          }
        }
      } catch {
        // continue
      }
    }

    // 2. Retrieve lyrics
    const lyricsData = await this.lyricsService.getLyrics(song);
    if (!lyricsData || !lyricsData.plainLyrics.trim()) {
      throw new Error(`Lyrics are not available for "${song.title}" by ${song.artist}.`);
    }

    let rawPlain = lyricsData.plainLyrics;
    let rawSynced = lyricsData.syncedLyrics || curatedMatch?.syncedLyrics;

    // 3. If lyrics contain Japanese characters, romanize them to 100% QWERTY ASCII!
    if (hasJapaneseCharacters(rawPlain) || (rawSynced && hasJapaneseCharacters(rawSynced))) {
      if (rawSynced) {
        rawSynced = await romanizeLrcLyrics(rawSynced);
      }
      rawPlain = await romanizeLrcLyrics(rawPlain);
    }

    const cleaned = cleanLyrics(rawPlain);
    const lines = cleaned.split('\n').filter(l => l.trim().length > 0);

    // 4. Parse synced lyrics or generate synthetic cadence
    let syncedLines: SyncedLyricLine[] = [];

    if (rawSynced) {
      syncedLines = parseLrc(rawSynced);
      // Ensure all lines in syncedLines are clean QWERTY ASCII and lowercase
      syncedLines = syncedLines.map(l => ({
        ...l,
        text: normalizeRomajiToQwerty(l.text).toLowerCase(),
      }));
    }

    if (syncedLines.length === 0) {
      syncedLines = generateSyntheticTiming(cleaned, song.duration || 200).map(l => ({
        ...l,
        text: l.text.toLowerCase(),
      }));
    }

    const lowerLines = (syncedLines.length > 0 ? syncedLines.map(l => l.text) : lines).map(l => l.toLowerCase());

    return {
      ...song,
      youtubeId,
      previewUrl: song.previewUrl || curatedMatch?.previewUrl,
      lyrics: cleaned.toLowerCase(),
      lines: lowerLines,
      syncedLyrics: rawSynced ? rawSynced.toLowerCase() : rawSynced,
      syncedLines,
    };
  }
}

export const defaultSongProvider = new SongProvider();
