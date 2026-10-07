import { HistoryItem } from '../types/song';

const STORAGE_KEY = 'lyrictype_history_v1';
const SOUND_PREF_KEY = 'lyrictype_sound_enabled';

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'date'>): HistoryItem {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toISOString(),
  };

  const updated = [newItem, ...history].slice(0, 50); // keep recent 50
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // quota exceeded or disabled
  }

  return newItem;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getUserStats(): {
  totalTests: number;
  bestWpm: number;
  avgAccuracy: number;
  totalErrors: number;
  highestStreak: number;
} {
  const history = getHistory();
  if (history.length === 0) {
    return {
      totalTests: 0,
      bestWpm: 0,
      avgAccuracy: 0,
      totalErrors: 0,
      highestStreak: 0,
    };
  }

  const bestWpm = Math.max(...history.map(h => h.wpm), 0);
  const highestStreak = Math.max(...history.map(h => h.highestStreak || 0), 0);
  const avgAccuracy = Math.round(
    history.reduce((acc, h) => acc + h.accuracy, 0) / history.length
  );
  const totalErrors = history.reduce((acc, h) => acc + h.errors, 0);

  return {
    totalTests: history.length,
    bestWpm,
    avgAccuracy,
    totalErrors,
    highestStreak,
  };
}

export function getSoundPreference(): boolean {
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_PREF_KEY, String(enabled));
  } catch {
    // ignore
  }
}
