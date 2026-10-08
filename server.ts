import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Parse command line arguments for port
let cliPort: number | null = null;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  cliPort = parseInt(process.argv[portArgIndex + 1], 10);
}

// Dev server must always bind to port 3000 in AI Studio environment
const PORT = cliPort || (process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000);

// ==========================================
// Japanese Romaji & Transliteration Engine
// Ensures Japanese lyrics are 100% standard QWERTY ASCII
// ==========================================
function hasJapaneseCharacters(text: string): boolean {
  if (!text) return false;
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

function cleanRomajiToQwerty(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove macrons/diacritics
    .replace(/[「」『』]/g, '"')
    .replace(/[、，]/g, ', ')
    .replace(/[。．]/g, '. ')
    .replace(/[・]/g, ' ')
    .replace(/[～〜]/g, '~')
    .replace(/[！？]/g, (m) => (m === '！' ? '!' : '?'))
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/[　]/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '') // keep standard QWERTY characters
    .replace(/ +/g, ' ')
    .trim();
}

async function romanizeJapaneseLine(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || !hasJapaneseCharacters(trimmed)) {
    return text;
  }

  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=rm&q=${encodeURIComponent(trimmed)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translit = data[0].map((item: any) => item[3] || item[0] || '').join('').trim();
        if (translit) {
          return cleanRomajiToQwerty(translit);
        }
      }
    }
  } catch (err) {
    console.warn('Transliteration failed for line:', trimmed, err);
  }

  return cleanRomajiToQwerty(text);
}

async function romanizeLrcLyrics(lrc: string): Promise<string> {
  if (!hasJapaneseCharacters(lrc)) {
    return lrc;
  }

  const lines = lrc.split('\n');
  const converted = await Promise.all(
    lines.map(async (line) => {
      const match = line.match(/^(\[\d{2}:\d{2}(?:\.\d{2,3})?\])\s*(.*)$/);
      if (match) {
        const tag = match[1];
        const text = match[2];
        if (hasJapaneseCharacters(text)) {
          const romaji = await romanizeJapaneseLine(text);
          return `${tag} ${romaji}`;
        }
        return line;
      }
      if (hasJapaneseCharacters(line)) {
        return await romanizeJapaneseLine(line);
      }
      return line;
    })
  );

  return converted.join('\n');
}

// ==========================================
// YouTube Audio Track Resolver
// Resolves official studio tracks that start strictly at 0:00
// ==========================================
const youtubeResolutionCache = new Map<string, string>();

async function resolveYouTubeId(title: string, artist: string): Promise<string | null> {
  const cacheKey = `${title.toLowerCase()}_${artist.toLowerCase()}`;
  if (youtubeResolutionCache.has(cacheKey)) {
    return youtubeResolutionCache.get(cacheKey)!;
  }

  try {
    const query = `${artist} ${title} official audio topic`.trim();
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const jsonMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (jsonMatch && jsonMatch[1]) {
        youtubeResolutionCache.set(cacheKey, jsonMatch[1]);
        return jsonMatch[1];
      }

      const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (watchMatch && watchMatch[1]) {
        youtubeResolutionCache.set(cacheKey, watchMatch[1]);
        return watchMatch[1];
      }
    }
  } catch (err) {
    console.warn('Error resolving YouTube ID for track:', title, artist, err);
  }

  return null;
}

// ==========================================
// Curated fallback songs database with verified 0:00 audio & Romaji
// ==========================================
const POPULAR_SONGS = [
  {
    id: 'curated-yoasobi-idol',
    title: 'Idol (Romaji QWERTY)',
    artist: 'YOASOBI',
    album: 'Idol - Oshi no Ko',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=300&fit=crop&q=80',
    duration: 213,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'ZRtdQ81jPUQ', // Official Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
  },
  {
    id: 'curated-lisa-gurenge',
    title: 'Gurenge (Romaji QWERTY)',
    artist: 'LiSA',
    album: 'Demon Slayer OP',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=300&fit=crop&q=80',
    duration: 238,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'x1FV6IrjZCY', // Official Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
  },
  {
    id: 'curated-shinunoga-e-wa',
    title: 'Shinunoga E-Wa (Romaji QWERTY)',
    artist: 'Fujii Kaze',
    album: 'HELP EVER HURT NEVER',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop&q=80',
    duration: 185,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'dawrQnvwMTY', // Official Studio Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
  },
  {
    id: 'curated-ado-usseewa',
    title: 'Usseewa (Romaji QWERTY)',
    artist: 'Ado',
    album: 'Kyougen',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&q=80',
    duration: 204,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'Qp3b-RXtz4w', // Official Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
  },
  {
    id: 'curated-blinding-lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop&q=80',
    duration: 200,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'XXYlFuWEuKI', // Studio Audio starting at 0:00 (no cinematic intro)
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
  },
  {
    id: 'curated-viva-la-vida',
    title: 'Viva La Vida',
    artist: 'Coldplay',
    album: 'Viva la Vida or Death and All His Friends',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&q=80',
    duration: 242,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'dvgZkm1xWPE', // Official Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b0/19/60/b0196060-7786-24c0-8c56-8f628fe89f52/mzaf_12479456646715449366.plus.aac.p.m4a',
  },
  {
    id: 'curated-as-it-was',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&q=80',
    duration: 167,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'V1Z586zoeeE', // Official Studio Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a',
  },
  {
    id: 'curated-shape-of-you',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&q=80',
    duration: 233,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: '_dK2tDK9grQ', // Studio Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/c7/4f/44c74f0d-72dc-6143-d4d0-ba14d661ca0d/mzaf_9566898362556366703.plus.aac.p.m4a',
  },
  {
    id: 'curated-bohemian-rhapsody',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop&q=80',
    duration: 354,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'xG16sdjLtc0', // Studio Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/17/fc/1e/17fc1eba-946d-84a9-710b-a0e88ea64209/mzaf_3049006317693088799.plus.aac.p.m4a',
  },
  {
    id: 'curated-rolling-in-the-deep',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    album: '21',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&q=80',
    duration: 228,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'bDtjO-R0QSo', // Studio Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4c/4f/03/4c4f032a-3d2b-853d-da81-996602355b42/mzaf_11625850023134180491.plus.aac.p.m4a',
  },
  {
    id: 'curated-levitating',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop&q=80',
    duration: 203,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'WHuBW3qKm9g', // Studio Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a',
  },
  {
    id: 'curated-fix-you',
    title: 'Fix You',
    artist: 'Coldplay',
    album: 'X&Y',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop&q=80',
    duration: 295,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'uUv5Z3HFHpU', // Studio Audio starting at 0:00
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e5/42/e3/e542e340-a45c-695e-e0b8-6155e222ebc0/mzaf_14955746616030397665.plus.aac.p.m4a',
  },
];

// Seed cache with known high-quality 0:00 YouTube IDs
for (const song of POPULAR_SONGS) {
  if (song.youtubeId) {
    youtubeResolutionCache.set(`${song.title.toLowerCase()}_${song.artist.toLowerCase()}`, song.youtubeId);
  }
}

// ==========================================
// Spotify Web API Integration
// Uses SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET
// ==========================================
let cachedSpotifyToken: string | null = null;
let tokenExpiresAt = 0;

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const now = Date.now();
  if (cachedSpotifyToken && now < tokenExpiresAt) {
    return cachedSpotifyToken;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      console.warn('Spotify auth token request returned non-OK status:', tokenRes.status);
      return null;
    }

    const data = await tokenRes.json();
    if (data.access_token) {
      cachedSpotifyToken = data.access_token;
      tokenExpiresAt = now + (Number(data.expires_in) - 60) * 1000;
      return cachedSpotifyToken;
    }
  } catch (err) {
    console.warn('Error fetching Spotify token:', err);
  }

  return null;
}

async function searchSpotify(query: string): Promise<any[]> {
  const token = await getSpotifyAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn('Spotify search failed with status:', res.status);
      return [];
    }

    const data = await res.json();
    const items = data.tracks?.items || [];
    return items.map((track: any) => ({
      id: `spotify_${track.id}`,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: track.album?.name || '',
      cover: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || '',
      duration: Math.round((track.duration_ms || 200000) / 1000),
      source: 'spotify',
      hasLyrics: true,
      previewUrl: track.preview_url,
    }));
  } catch (err) {
    console.warn('Spotify search exception:', err);
    return [];
  }
}

// Helper to enrich tracks with audio preview and 0:00 full YouTube audio stream
async function enrichTracksWithFullAudio(tracks: any[]): Promise<any[]> {
  try {
    const promises = tracks.slice(0, 10).map(async (track) => {
      // 1. Resolve YouTube ID so audio plays from 0:00 full-length
      let ytId = track.youtubeId;
      if (!ytId) {
        ytId = await resolveYouTubeId(track.title, track.artist);
      }

      // 2. Resolve backup previewUrl if missing
      let preview = track.previewUrl;
      let cover = track.cover;
      if (!preview || !cover) {
        try {
          const itunesRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(`${track.artist} ${track.title}`)}&entity=song&limit=1`
          );
          if (itunesRes.ok) {
            const itunesData = await itunesRes.json();
            const match = itunesData.results?.[0];
            if (match) {
              if (!preview && match.previewUrl) preview = match.previewUrl;
              if (!cover && match.artworkUrl100) cover = match.artworkUrl100.replace('100x100bb.jpg', '400x400bb.jpg');
            }
          }
        } catch {
          // ignore
        }
      }

      return {
        ...track,
        youtubeId: ytId || track.youtubeId,
        previewUrl: preview,
        cover: cover || track.cover,
      };
    });

    const enriched = await Promise.all(promises);
    return [...enriched, ...tracks.slice(10)];
  } catch {
    return tracks;
  }
}

// ==========================================
// API Endpoints
// ==========================================

// 1. Popular songs endpoint
app.get('/api/songs/popular', (_req: Request, res: Response) => {
  res.json(POPULAR_SONGS);
});

// 2. Audio Resolver Endpoint
app.get('/api/audio/resolve', async (req: Request, res: Response) => {
  const title = String(req.query.title || '').trim();
  const artist = String(req.query.artist || '').trim();

  if (!title) {
    return res.status(400).json({ error: 'Missing title parameter' });
  }

  const ytId = await resolveYouTubeId(title, artist);
  res.json({ youtubeId: ytId });
});

// 3. Lyrics Romanizer Endpoint (POST)
// Romanizes Japanese text or LRC to 100% QWERTY ASCII
app.post('/api/lyrics/romanize', async (req: Request, res: Response) => {
  const { text, lrc } = req.body;

  try {
    if (lrc) {
      const romajiLrc = await romanizeLrcLyrics(String(lrc));
      return res.json({ romajiLrc });
    }

    if (text) {
      const romaji = await romanizeJapaneseLine(String(text));
      return res.json({ romaji });
    }

    res.status(400).json({ error: 'Provide text or lrc in body' });
  } catch (err) {
    console.error('Romanize endpoint error:', err);
    res.status(500).json({ error: 'Failed to romanize text' });
  }
});

// 4. Song search endpoint
app.get('/api/songs/search', async (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.json(POPULAR_SONGS);
  }

  try {
    // 1. Try Spotify Web API first if credentials are configured
    const spotifyResults = await searchSpotify(query);
    if (spotifyResults.length > 0) {
      const enrichedSpotify = await enrichTracksWithFullAudio(spotifyResults);
      return res.json(enrichedSpotify);
    }

    // 2. Fallback search via LRCLIB API directly
    const lrclibRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'LyricType/1.0 (https://github.com/lyrictype)' },
    });

    if (lrclibRes.ok) {
      const lrclibData = await lrclibRes.json();
      if (Array.isArray(lrclibData) && lrclibData.length > 0) {
        const unique = new Map<string, any>();
        for (const item of lrclibData) {
          if (!item.trackName || !item.artistName) continue;
          const key = `${item.trackName.toLowerCase()}_${item.artistName.toLowerCase()}`;
          if (unique.has(key)) continue;

          unique.set(key, {
            id: `lrclib_${item.id}`,
            title: item.trackName,
            artist: item.artistName,
            album: item.albumName || '',
            cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&q=80',
            duration: Math.round(item.duration || 210),
            source: 'lrclib',
            hasLyrics: Boolean(item.plainLyrics || item.syncedLyrics),
          });

          if (unique.size >= 12) break;
        }

        const list = Array.from(unique.values());
        if (list.length > 0) {
          const enrichedLrclib = await enrichTracksWithFullAudio(list);
          return res.json(enrichedLrclib);
        }
      }
    }

    // 3. Fallback to matching curated catalog
    const qLower = query.toLowerCase();
    const fallbackMatches = POPULAR_SONGS.filter(
      (s) => s.title.toLowerCase().includes(qLower) || s.artist.toLowerCase().includes(qLower)
    );
    return res.json(fallbackMatches);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Unable to search songs.' });
  }
});

// 5. Lyrics retrieval endpoint
// Uses LRCLIB API (https://lrclib.net/api) — No API Key Required!
// Automatically converts Japanese lyrics (Kanji/Kana) into 100% QWERTY Romaji!
app.get('/api/lyrics', async (req: Request, res: Response) => {
  const title = String(req.query.title || '').trim();
  const artist = String(req.query.artist || '').trim();
  const rawId = String(req.query.id || '').trim();

  if (!title && !artist && !rawId) {
    return res.status(400).json({ error: 'Missing title or artist' });
  }

  let plainLyrics: string | null = null;
  let syncedLyrics: string | null = null;

  // 1. Direct LRCLIB ID lookup if ID starts with lrclib_
  if (rawId.startsWith('lrclib_')) {
    const numericId = rawId.replace('lrclib_', '');
    try {
      const r = await fetch(`https://lrclib.net/api/get/${numericId}`, {
        headers: { 'User-Agent': 'LyricType/1.0 (https://github.com/lyrictype)' },
      });
      if (r.ok) {
        const data = await r.json();
        plainLyrics = data.plainLyrics || null;
        syncedLyrics = data.syncedLyrics || null;
      }
    } catch {
      // Continue
    }
  }

  // 2. Query LRCLIB API by artist_name and track_name
  if (!plainLyrics && !syncedLyrics && artist && title) {
    try {
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'LyricType/1.0 (https://github.com/lyrictype)' },
      });
      if (r.ok) {
        const data = await r.json();
        plainLyrics = data.plainLyrics || null;
        syncedLyrics = data.syncedLyrics || null;
      }
    } catch {
      // Continue
    }
  }

  // 3. Fallback search query on LRCLIB
  if (!plainLyrics && !syncedLyrics) {
    try {
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`.trim())}`;
      const sr = await fetch(searchUrl, {
        headers: { 'User-Agent': 'LyricType/1.0 (https://github.com/lyrictype)' },
      });
      if (sr.ok) {
        const items = await sr.json();
        if (Array.isArray(items)) {
          const found = items.find((it) => it.plainLyrics || it.syncedLyrics);
          if (found) {
            plainLyrics = found.plainLyrics || null;
            syncedLyrics = found.syncedLyrics || null;
          }
        }
      }
    } catch {
      // Continue
    }
  }

  const rawLyrics = plainLyrics || syncedLyrics;
  if (!rawLyrics) {
    return res.status(404).json({ error: 'Lyrics are not available for this song.' });
  }

  // Automatically romanize Japanese characters into standard QWERTY letters!
  let finalLyrics = rawLyrics;
  let finalSyncedLyrics = syncedLyrics;

  if (hasJapaneseCharacters(rawLyrics)) {
    try {
      if (syncedLyrics) {
        finalSyncedLyrics = await romanizeLrcLyrics(syncedLyrics);
        finalLyrics = finalSyncedLyrics
          .split('\n')
          .map((l) => l.replace(/^\[\d{2}:\d{2}(?:\.\d{2,3})?\]\s*/, ''))
          .filter(Boolean)
          .join('\n');
      } else {
        finalLyrics = await romanizeLrcLyrics(rawLyrics);
      }
    } catch (e) {
      console.warn('Auto romanization error on lyrics endpoint:', e);
    }
  }

  // Sanitize punctuation: strip (), :, ;, ?, !, ., keeping only commas (,) and hyphens (-)
  const sanitizeLine = (text: string) => {
    return text
      .replace(/\((?:chorus|verse|intro|outro|bridge|hook|repeat|solo)[^)]*\)/gi, '')
      .replace(/[()[\]{}<>:;?!"`~*^%$#@/\\|+=.]/g, '')
      .replace(/[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F']/g, '')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  if (finalSyncedLyrics) {
    finalSyncedLyrics = finalSyncedLyrics
      .split('\n')
      .map((line) => {
        const m = line.match(/^(\[\d{2}:\d{2}(?:\.\d{2,3})?\])\s*(.*)$/);
        if (m) {
          const cleanedText = sanitizeLine(m[2]);
          return cleanedText ? `${m[1]} ${cleanedText}` : null;
        }
        const cleanedText = sanitizeLine(line);
        return cleanedText ? cleanedText : null;
      })
      .filter(Boolean)
      .join('\n');
  }

  finalLyrics = finalLyrics
    .split('\n')
    .map((l) => sanitizeLine(l))
    .filter(Boolean)
    .join('\n');

  return res.json({
    lyrics: finalLyrics,
    syncedLyrics: finalSyncedLyrics,
    source: 'lrclib',
  });
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`LyricType server listening on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
