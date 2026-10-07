export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover: string;
  duration: number; // in seconds
  source: 'spotify' | 'lrclib' | 'itunes' | 'curated' | 'custom' | 'youtube';
  hasLyrics: boolean;
  previewUrl?: string;
  youtubeId?: string; // YouTube video ID for full length playback
}

export interface SyncedLyricLine {
  id: number;
  timeSeconds: number; // Starting timestamp in seconds
  endTimeSeconds: number; // Ending timestamp in seconds
  text: string;
}

export interface SongWithLyrics extends Song {
  lyrics: string;
  lines: string[];
  syncedLyrics?: string;
  syncedLines?: SyncedLyricLine[];
}

export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctCharacters: number;
  incorrectCharacters: number;
  errors: number;
  streak: number;
  highestStreak: number;
  progress: number;
  elapsedSeconds: number;
}

export interface HistoryItem {
  id: string;
  songTitle: string;
  artist: string;
  cover: string;
  wpm: number;
  accuracy: number;
  errors: number;
  highestStreak: number;
  duration: number; // seconds
  date: string;
}

export type ViewMode = 'HOME' | 'SONGS' | 'TYPING' | 'RESULT' | 'HISTORY';

export type LyricLengthMode = 'FULL' | 'CHORUS' | 'QUICK';
