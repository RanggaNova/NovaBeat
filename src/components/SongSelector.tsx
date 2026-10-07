import React, { useState, useEffect } from 'react';
import { Song, LyricLengthMode } from '../types/song';
import { SongCard } from './SongCard';
import { defaultSongProvider } from '../services/songProvider';
import { Search, Loader2, AlertCircle, Sparkles, Music2 } from 'lucide-react';

interface SongSelectorProps {
  onSelectSong: (song: Song, lengthMode: LyricLengthMode) => void;
  selectedSongId?: string;
}

export const SongSelector: React.FC<SongSelectorProps> = ({
  onSelectSong,
  selectedSongId,
}) => {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load popular songs initially
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    defaultSongProvider
      .getPopularSongs()
      .then(res => {
        if (isMounted) {
          setSongs(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMsg('Gagal memuat daftar lagu. Silakan coba lagi.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Search debounced
  useEffect(() => {
    if (!query.trim()) {
      defaultSongProvider.getPopularSongs().then(res => setSongs(res));
      setErrorMsg(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      setErrorMsg(null);
      defaultSongProvider
        .searchSongs(query)
        .then(results => {
          setSongs(results);
          setIsLoading(false);
          if (results.length === 0) {
            setErrorMsg(`Tidak ada lagu yang cocok dengan pencarian "${query}". Coba judul atau musisi lain.`);
          }
        })
        .catch(() => {
          setErrorMsg('Gagal mencari lagu. Silakan coba lagi.');
          setIsLoading(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Music2 className="w-7 h-7 text-cyan-400" />
            <span>Pilih Lagu Favorit</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-normal">
            Koleksi lagu dengan sinkronisasi vokal video YouTube dan ritme ketukan bersih
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari lagu apa saja (misal: YOASOBI, Fujii Kaze, Bruno Mars, Coldplay, Ado)..."
            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.04] rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:bg-white/[0.07] text-base backdrop-blur-md transition-all shadow-md"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mencari...</span>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {query.trim() ? `Hasil Pencarian (${songs.length})` : 'Daftar Lagu Pilihan'}
        </span>
        <span className="text-xs text-zinc-500 font-mono">
          Lirik Lengkap & Video YouTube
        </span>
      </div>

      {/* Songs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            isSelected={song.id === selectedSongId}
            onSelect={(s) => onSelectSong(s, 'FULL')}
          />
        ))}
      </div>
    </div>
  );
};
