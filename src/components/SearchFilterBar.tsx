import React from 'react';
import { RotateCcw, Search } from 'lucide-react';

interface SearchFilterBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  genre: string;
  onGenreChange: (val: string) => void;
  genres: string[];
  artist: string;
  onArtistChange: (val: string) => void;
  artists: string[];
  album: string;
  onAlbumChange: (val: string) => void;
  albums: string[];
  level?: string;
  onLevelChange?: (val: string) => void;
  levels?: string[];
  totalCount: number;
  filteredCount: number;
  placeholder?: string;
  onReset: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  query,
  onQueryChange,
  genre,
  onGenreChange,
  genres,
  artist,
  onArtistChange,
  artists,
  album,
  onAlbumChange,
  albums,
  level,
  onLevelChange,
  levels,
  totalCount,
  filteredCount,
  placeholder = 'Buscar lección, técnica, artista, álbum o tonalidad...',
  onReset,
}) => {
  const hasActiveFilter = Boolean(query || genre || artist || album || level);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="md:col-span-2">
          <select
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
            aria-label="Filtrar por género"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="">Todos los géneros</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={artist}
            onChange={(e) => onArtistChange(e.target.value)}
            aria-label="Filtrar por artista"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="">Todos los artistas</option>
            {artists.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={album}
            onChange={(e) => onAlbumChange(e.target.value)}
            aria-label="Filtrar por álbum"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="">Todos los álbumes</option>
            {albums.map((al) => (
              <option key={al} value={al}>
                {al}
              </option>
            ))}
          </select>
        </div>

        {levels && onLevelChange && (
          <div className="md:col-span-2">
            <select
              value={level || ''}
              onChange={(e) => onLevelChange(e.target.value)}
              aria-label="Filtrar por nivel"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="">Todos los niveles</option>
              {levels.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="tabular-nums">
          Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredCount}</strong> de{' '}
          {totalCount} elementos
        </span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
};
