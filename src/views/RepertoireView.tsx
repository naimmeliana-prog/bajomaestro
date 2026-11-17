import React, { useMemo, useState } from 'react';
import { CalendarPlus, Disc3, FileText, Sliders, User } from 'lucide-react';
import { NotationDisplay } from '../components/NotationDisplay';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { useSync } from '../context/SyncContext';
import { getPdfById } from '../data/pdfResources';
import { REPERTOIRE_TRACKS } from '../data/repertoire';
import { RepertoireTrack } from '../types/music';

interface RepertoireViewProps {
  onOpenPdf: (pdfId: string) => void;
}

export const RepertoireView: React.FC<RepertoireViewProps> = ({ onOpenPdf }) => {
  const { addPracticeItem } = useSync();

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [level, setLevel] = useState('');
  const [selectedId, setSelectedId] = useState<string>(REPERTOIRE_TRACKS[0].id);
  const [toast, setToast] = useState<string | null>(null);

  const genres = useMemo(
    () => Array.from(new Set(REPERTOIRE_TRACKS.map((t) => t.genre))).sort(),
    []
  );
  const artists = useMemo(
    () => Array.from(new Set(REPERTOIRE_TRACKS.map((t) => t.artist))).sort(),
    []
  );
  const albums = useMemo(
    () => Array.from(new Set(REPERTOIRE_TRACKS.map((t) => t.album))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REPERTOIRE_TRACKS.filter((t) => {
      if (genre && t.genre !== genre) return false;
      if (artist && t.artist !== artist) return false;
      if (album && t.album !== album) return false;
      if (level && t.level !== level) return false;
      if (!q) return true;
      return `${t.title} ${t.genre} ${t.subgenre} ${t.artist} ${t.album} ${t.bassist} ${t.toneNotes} ${t.harmonicAnalysis}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, genre, artist, album, level]);

  const activeTrack: RepertoireTrack =
    filtered.find((t) => t.id === selectedId) || filtered[0] || REPERTOIRE_TRACKS[0];

  const pdfSource = getPdfById(activeTrack.pdfSourceId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Repertorio Aplicado y Enciclopedia de Grooves
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Estudia líneas reales por género, subgénero, artista, álbum y bajista legendario
        </p>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        genre={genre}
        onGenreChange={setGenre}
        genres={genres}
        artist={artist}
        onArtistChange={setArtist}
        artists={artists}
        album={album}
        onAlbumChange={setAlbum}
        albums={albums}
        level={level}
        onLevelChange={setLevel}
        levels={['Principiante', 'Intermedio', 'Avanzado', 'Maestro']}
        totalCount={REPERTOIRE_TRACKS.length}
        filteredCount={filtered.length}
        placeholder="Buscar por género, artista, álbum, bajista o técnica (Slap, Walking, Tumbao)..."
        onReset={() => {
          setQuery('');
          setGenre('');
          setArtist('');
          setAlbum('');
          setLevel('');
        }}
      />

      {toast && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-[75vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No se encontraron temas con esos filtros.
            </div>
          ) : (
            filtered.map((track) => {
              const selected = track.id === activeTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedId(track.id)}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                    selected
                      ? 'bg-amber-50/70 dark:bg-amber-950/25'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {track.genre} · {track.subgenre} · {track.year}
                  </div>
                  <div
                    className={`text-sm font-semibold mt-0.5 ${
                      selected
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {track.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                    {track.artist} · {track.album} · {track.tempo} BPM
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {activeTrack.genre} / {activeTrack.subgenre} · {activeTrack.level}
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {activeTrack.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <strong>Artista:</strong> {activeTrack.artist}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Disc3 className="w-3.5 h-3.5 text-slate-400" />
                    <strong>Álbum:</strong> {activeTrack.album} ({activeTrack.year})
                  </span>
                  <span>
                    <strong>Bajista:</strong> {activeTrack.bassist}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void addPracticeItem({
                      title: `${activeTrack.title} (${activeTrack.artist})`,
                      category: 'repertoire',
                      targetBpm: activeTrack.tempo,
                      durationMinutes: 15,
                      lessonId: activeTrack.id,
                    });
                    setToast('Groove añadido a tu plan de práctica diario.');
                    window.setTimeout(() => setToast(null), 2600);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-amber-500 cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 text-amber-600" />
                  Practicar hoy
                </button>
                {pdfSource && (
                  <button
                    type="button"
                    onClick={() => onOpenPdf(pdfSource.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-xs font-semibold text-amber-700 dark:text-amber-300 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    PDF Fuente
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Análisis Armónico y Rítmico
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeTrack.harmonicAnalysis}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 tabular-nums">
                  Tonalidad: {activeTrack.key} · Compás: {activeTrack.timeSignature} · Tempo:{' '}
                  {activeTrack.tempo} BPM · Técnicas: {activeTrack.techniques.join(', ')}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Sliders className="w-3.5 h-3.5" />
                  Timbre y Equipo (Rig & Tone)
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeTrack.toneNotes}
                </p>
              </div>
            </div>
          </div>

          <NotationDisplay
            notes={activeTrack.bassline}
            timeSignature={activeTrack.timeSignature}
            keySignature={activeTrack.key}
            initialBpm={activeTrack.tempo}
            defaultToneMode={
              activeTrack.techniques.includes('Slap & Pop')
                ? 'electric_slap'
                : activeTrack.techniques.includes('Púa (Pick)')
                  ? 'electric_pick'
                  : activeTrack.instrumentScope === 'Acústico'
                    ? 'acoustic_upright'
                    : 'electric_finger'
            }
          />
        </div>
      </div>
    </div>
  );
};
