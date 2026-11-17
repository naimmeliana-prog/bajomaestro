import React, { useMemo, useState } from 'react';
import { Eye, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { NotationDisplay } from '../components/NotationDisplay';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { CURATED_SIGHT_READING, generateProceduralSightReading } from '../data/sightReading';
import { DifficultyLevel, SightReadingEtude, TimeSignature } from '../types/music';

interface SightReadingViewProps {
  onOpenPdf: (pdfId: string) => void;
}

export const SightReadingView: React.FC<SightReadingViewProps> = ({ onOpenPdf }) => {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [level, setLevel] = useState('');

  const [genLevel, setGenLevel] = useState<DifficultyLevel>('Intermedio');
  const [genKey, setGenKey] = useState<string>('C');
  const [genMeter, setGenMeter] = useState<TimeSignature>('4/4');
  const [customEtude, setCustomEtude] = useState<SightReadingEtude | null>(null);
  const [selectedId, setSelectedId] = useState<string>(CURATED_SIGHT_READING[0].id);

  const genres = useMemo(
    () => Array.from(new Set(CURATED_SIGHT_READING.map((e) => e.genre))).sort(),
    []
  );
  const artists = useMemo(
    () => Array.from(new Set(CURATED_SIGHT_READING.map((e) => e.artist))).sort(),
    []
  );
  const albums = useMemo(
    () => Array.from(new Set(CURATED_SIGHT_READING.map((e) => e.album))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURATED_SIGHT_READING.filter((e) => {
      if (genre && e.genre !== genre) return false;
      if (artist && e.artist !== artist) return false;
      if (album && e.album !== album) return false;
      if (level && e.level !== level) return false;
      if (!q) return true;
      return `${e.title} ${e.genre} ${e.artist} ${e.album} ${e.keySignature} ${e.sightReadingTip}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, genre, artist, album, level]);

  const activeEtude: SightReadingEtude =
    customEtude || filtered.find((e) => e.id === selectedId) || filtered[0] || CURATED_SIGHT_READING[0];

  const handleGenerate = () => {
    const next = generateProceduralSightReading({
      level: genLevel,
      keySignature: genKey,
      timeSignature: genMeter,
      bars: 4,
    });
    setCustomEtude(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Entrenamiento de Lectura a Primera Vista
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Partituras reales de los métodos adjuntos + generador infinito de ejercicios en Clave de Fa
          </p>
        </div>
      </div>

      {/* Procedural Sight-Reading Generator Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            Generador Infinito a Primera Vista
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Crea partituras nuevas en el momento para entrenar lectura pura sin memoria muscular
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={genLevel}
            onChange={(e) => setGenLevel(e.target.value as DifficultyLevel)}
            aria-label="Nivel del generador"
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          >
            <option value="Principiante">Principiante (Negras/Blancas)</option>
            <option value="Intermedio">Intermedio (Corcheas/Puntillos)</option>
            <option value="Avanzado">Avanzado (Semicorcheas/Silencios)</option>
            <option value="Maestro">Maestro (Síncopas Complejas)</option>
          </select>

          <select
            value={genKey}
            onChange={(e) => setGenKey(e.target.value)}
            aria-label="Tonalidad del generador"
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          >
            <option value="C">Do Mayor (C)</option>
            <option value="G">Sol Mayor (G)</option>
            <option value="D">Re Mayor (D)</option>
            <option value="F">Fa Mayor (F)</option>
            <option value="Bb">Sib Mayor (Bb)</option>
            <option value="Am">La Menor (Am)</option>
            <option value="Em">Mi Menor (Em)</option>
            <option value="Dm">Re Menor (Dm)</option>
          </select>

          <select
            value={genMeter}
            onChange={(e) => setGenMeter(e.target.value as TimeSignature)}
            aria-label="Compás del generador"
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="2/4">2/4</option>
            <option value="6/8">6/8</option>
            <option value="5/4">5/4</option>
            <option value="7/8">7/8</option>
          </select>

          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generar Partitura Nueva
          </button>
        </div>
      </div>

      {/* Filter Curated Book Etudes */}
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
        totalCount={CURATED_SIGHT_READING.length}
        filteredCount={filtered.length}
        placeholder="Buscar estudios de lectura por tonalidad, compás, autor o técnica..."
        onReset={() => {
          setQuery('');
          setGenre('');
          setArtist('');
          setAlbum('');
          setLevel('');
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {filtered.map((etude) => {
            const selected = !customEtude && etude.id === activeEtude.id;
            return (
              <button
                key={etude.id}
                type="button"
                onClick={() => {
                  setCustomEtude(null);
                  setSelectedId(etude.id);
                }}
                className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                  selected
                    ? 'bg-amber-50/70 dark:bg-amber-950/25'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {etude.level} · {etude.timeSignature} · Tonalidad {etude.keySignature}
                </div>
                <div
                  className={`text-sm font-semibold mt-0.5 ${
                    selected
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {etude.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {etude.artist} · {etude.album}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {activeEtude.sourceLabel} · {activeEtude.level} · Compás {activeEtude.timeSignature}
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {activeEtude.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onOpenPdf(activeEtude.pdfSourceId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-amber-500 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Abrir libro PDF
              </button>
            </div>

            <div className="p-3 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/60 flex items-start gap-2.5 text-xs sm:text-sm text-sky-900 dark:text-sky-200">
              <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
              <div>
                <strong>Consejo de Lectura:</strong> {activeEtude.sightReadingTip}
              </div>
            </div>
          </div>

          <NotationDisplay
            notes={activeEtude.notes}
            timeSignature={activeEtude.timeSignature}
            keySignature={activeEtude.keySignature}
            initialBpm={activeEtude.bpm}
            defaultDisplayMode="staff"
          />
        </div>
      </div>
    </div>
  );
};
