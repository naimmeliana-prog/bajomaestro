import React, { useEffect, useMemo, useState } from 'react';
import { Info, Music2, Play, Volume2 } from 'lucide-react';
import { FretboardDiagram } from '../components/FretboardDiagram';
import { NotationDisplay } from '../components/NotationDisplay';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { CHORDS_LIBRARY, SCALES_AND_MODES } from '../data/theoryLibrary';
import { NoteEvent } from '../types/music';
import { playBassNote } from '../utils/audioEngine';
import { NOTE_NAMES_ES_SHARP, NOTE_NAMES_SHARP, TUNING_PRESETS } from '../utils/musicTheory';

export const LibraryView: React.FC = () => {
  const [libraryTab, setLibraryTab] = useState<'scales' | 'chords'>('scales');
  const [rootPc, setRootPc] = useState<number>(4); // E default
  const [tuningId, setTuningId] = useState<string>('4-standard');
  const [fretboardMode, setFretboardMode] = useState<'shape' | 'full'>('shape');
  const [selectedShapeIdx, setSelectedShapeIdx] = useState<number>(0);

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');

  const [selectedScaleId, setSelectedScaleId] = useState(SCALES_AND_MODES[0].id);
  const [selectedChordId, setSelectedChordId] = useState(CHORDS_LIBRARY[0].id);

  const tuning = TUNING_PRESETS.find((t) => t.id === tuningId) || TUNING_PRESETS[0];
  const activeItems = libraryTab === 'scales' ? SCALES_AND_MODES : CHORDS_LIBRARY;

  const genres = useMemo(
    () => Array.from(new Set(activeItems.flatMap((i) => i.genres))).sort(),
    [activeItems]
  );
  const artists = useMemo(
    () => Array.from(new Set(activeItems.flatMap((i) => i.artists))).sort(),
    [activeItems]
  );
  const albums = useMemo(
    () => Array.from(new Set(activeItems.flatMap((i) => i.albums))).sort(),
    [activeItems]
  );

  const filteredScales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCALES_AND_MODES.filter((s) => {
      if (genre && !s.genres.includes(genre)) return false;
      if (artist && !s.artists.includes(artist)) return false;
      if (album && !s.albums.includes(album)) return false;
      if (!q) return true;
      return `${s.nameEs} ${s.nameIntl} ${s.category} ${s.formula} ${s.genres.join(' ')} ${s.artists.join(' ')} ${s.albums.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, genre, artist, album]);

  const filteredChords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHORDS_LIBRARY.filter((c) => {
      if (genre && !c.genres.includes(genre)) return false;
      if (artist && !c.artists.includes(artist)) return false;
      if (album && !c.albums.includes(album)) return false;
      if (!q) return true;
      return `${c.nameEs} ${c.symbolSuffix} ${c.category} ${c.formula} ${c.genres.join(' ')} ${c.artists.join(' ')} ${c.albums.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, genre, artist, album]);

  const activeScale =
    filteredScales.find((s) => s.id === selectedScaleId) || filteredScales[0] || SCALES_AND_MODES[0];
  const activeChord =
    filteredChords.find((c) => c.id === selectedChordId) || filteredChords[0] || CHORDS_LIBRARY[0];

  const availableShapes =
    libraryTab === 'scales' ? activeScale.shapes || [] : activeChord.shapes || [];

  useEffect(() => {
    setSelectedShapeIdx(0);
  }, [libraryTab, activeScale.id, activeChord.id]);

  const activeShape = availableShapes[selectedShapeIdx];

  const currentSemitones = libraryTab === 'scales' ? activeScale.semitones : activeChord.semitones;
  const currentIntervals = libraryTab === 'scales' ? activeScale.intervals : activeChord.intervals;

  const blueNoteSemitones = useMemo(() => {
    if (libraryTab !== 'scales' || !activeScale.blueNoteIndices) return [];
    return activeScale.blueNoteIndices.map((idx) => activeScale.semitones[idx]);
  }, [libraryTab, activeScale]);

  const baseMidi = useMemo(() => {
    const lowest = tuning.strings[tuning.strings.length - 1].midi;
    let m = 24 + rootPc;
    while (m < lowest) m += 12;
    return m;
  }, [rootPc, tuning]);

  const generatedNotes: NoteEvent[] = useMemo(() => {
    const rootLabel = `${NOTE_NAMES_SHARP[rootPc]}${libraryTab === 'chords' ? activeChord.symbolSuffix : ''}`;
    if (libraryTab === 'scales') {
      const asc = [...activeScale.semitones, 12];
      return asc.map((semi, i) => ({
        midi: baseMidi + semi,
        durationBeats: i === asc.length - 1 ? 2 : 0.5,
        chordSymbol: i === 0 ? rootLabel : undefined,
      }));
    }
    return activeChord.semitones.map((semi, i) => ({
      midi: baseMidi + semi,
      durationBeats: 1,
      chordSymbol: i === 0 ? rootLabel : undefined,
    }));
  }, [libraryTab, activeScale, activeChord, baseMidi, rootPc]);

  const handleAudition = () => {
    generatedNotes.forEach((n, idx) => {
      window.setTimeout(() => {
        playBassNote(n.midi, 0.58, 'electric_finger');
      }, idx * 250);
    });
  };

  const handlePlayBlueNoteDemo = () => {
    if (activeScale.id === 'scale-blues') {
      // 1 -> b3 -> 4 -> b5 (Blue Note) -> 5 -> 1
      const seq = [0, 3, 5, 6, 7, 12];
      seq.forEach((s, idx) => {
        window.setTimeout(() => {
          playBassNote(baseMidi + s, idx === 3 ? 0.65 : 0.45, 'electric_finger', idx === 3 ? 'accent' : 'normal');
        }, idx * 320);
      });
    } else {
      // Major Blues: 1 -> 2 -> b3 (Blue Note) -> 3 -> 5 -> 6
      const seq = [0, 2, 3, 4, 7, 9];
      seq.forEach((s, idx) => {
        window.setTimeout(() => {
          playBassNote(baseMidi + s, idx === 2 ? 0.55 : 0.45, 'electric_finger', idx === 2 ? 'accent' : 'normal');
        }, idx * 320);
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Biblioteca de Escalas, Shapes, Modos y Acordes
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Cajas transportables con digitación (dedos 1–4), explicación de la Nota de Blues y mástil completo
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => {
              setLibraryTab('scales');
              setGenre('');
              setArtist('');
              setAlbum('');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              libraryTab === 'scales'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Escalas y Modos ({SCALES_AND_MODES.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setLibraryTab('chords');
              setGenre('');
              setArtist('');
              setAlbum('');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              libraryTab === 'chords'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Acordes y Arpegios ({CHORDS_LIBRARY.length})
          </button>
        </div>
      </div>

      {/* Root & Tuning Selectors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tónica / Fundamental
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NOTE_NAMES_SHARP.map((noteName, pc) => (
              <button
                key={noteName}
                type="button"
                onClick={() => setRootPc(pc)}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${
                  rootPc === pc
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                }`}
              >
                {noteName} · {NOTE_NAMES_ES_SHARP[pc]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Configuración de Cuerdas
          </div>
          <select
            value={tuningId}
            onChange={(e) => setTuningId(e.target.value)}
            aria-label="Afinación del diapasón"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          >
            {TUNING_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
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
        totalCount={activeItems.length}
        filteredCount={libraryTab === 'scales' ? filteredScales.length : filteredChords.length}
        placeholder="Buscar escala, shape, blues, modo, acorde o artista..."
        onReset={() => {
          setQuery('');
          setGenre('');
          setArtist('');
          setAlbum('');
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Catalog List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-[75vh] overflow-y-auto">
          {libraryTab === 'scales'
            ? filteredScales.map((scale) => {
                const selected = scale.id === activeScale.id;
                return (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => setSelectedScaleId(scale.id)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-amber-50/70 dark:bg-amber-950/25'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {scale.category} · {scale.shapes ? `${scale.shapes.length} Shape(s)` : scale.nameIntl}
                    </div>
                    <div
                      className={`text-sm font-semibold mt-0.5 ${
                        selected
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {NOTE_NAMES_ES_SHARP[rootPc]} {scale.nameEs}
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {scale.intervals.join(' - ')}
                    </div>
                  </button>
                );
              })
            : filteredChords.map((chord) => {
                const selected = chord.id === activeChord.id;
                return (
                  <button
                    key={chord.id}
                    type="button"
                    onClick={() => setSelectedChordId(chord.id)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-amber-50/70 dark:bg-amber-950/25'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {chord.category} {chord.shapes ? `· ${chord.shapes.length} Shape(s)` : ''}
                    </div>
                    <div
                      className={`text-sm font-semibold mt-0.5 ${
                        selected
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {NOTE_NAMES_SHARP[rootPc]}
                      {chord.symbolSuffix} · {NOTE_NAMES_ES_SHARP[rootPc]} {chord.nameEs}
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {chord.intervals.join(' - ')}
                    </div>
                  </button>
                );
              })}
        </div>

        {/* Interactive Detail Stage */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {libraryTab === 'scales' ? activeScale.category : activeChord.category}
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {libraryTab === 'scales'
                    ? `${NOTE_NAMES_ES_SHARP[rootPc]} (${NOTE_NAMES_SHARP[rootPc]}) — ${activeScale.nameEs}`
                    : `${NOTE_NAMES_SHARP[rootPc]}${activeChord.symbolSuffix} — ${NOTE_NAMES_ES_SHARP[rootPc]} ${activeChord.nameEs}`}
                </h2>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  Fórmula: {libraryTab === 'scales' ? activeScale.formula : activeChord.formula}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAudition}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Escuchar {libraryTab === 'scales' ? 'Escala' : 'Arpegio'}
              </button>
            </div>

            {/* Note / Interval Table */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {currentSemitones.map((semi, idx) => {
                const pc = (rootPc + semi) % 12;
                const isBlue =
                  libraryTab === 'scales' && Boolean(activeScale.blueNoteIndices?.includes(idx));
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => playBassNote(baseMidi + semi, 0.75)}
                    className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                      isBlue
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-500'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-mono font-bold ${
                        isBlue ? 'text-sky-700 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {currentIntervals[idx]} {isBlue ? '★' : ''}
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {NOTE_NAMES_SHARP[pc]}
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400">
                      {NOTE_NAMES_ES_SHARP[pc]}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dedicated Blue Note Explanation Callout */}
            {libraryTab === 'scales' && activeScale.blueNoteExplanation && (
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/70 bg-sky-50/70 dark:bg-sky-950/30 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                    <Info className="w-4 h-4" />
                    ¿Qué es la Nota de Blues (Blue Note) y cómo se toca?
                  </div>
                  <button
                    type="button"
                    onClick={handlePlayBlueNoteDemo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    Escuchar tensión y resolución
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-sky-950 dark:text-sky-100 leading-relaxed">
                  {activeScale.blueNoteExplanation}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-amber-600" />
                  Aplicación al Bajo
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {libraryTab === 'scales' ? activeScale.usageTip : activeChord.bassApplication}
                </p>
              </div>
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Referencias de Género, Artistas y Álbumes
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div>
                    <strong>Géneros:</strong>{' '}
                    {(libraryTab === 'scales' ? activeScale.genres : activeChord.genres).join(' · ')}
                  </div>
                  <div>
                    <strong>Artistas:</strong>{' '}
                    {(libraryTab === 'scales' ? activeScale.artists : activeChord.artists).join(', ')}
                  </div>
                  <div>
                    <strong>Álbumes:</strong>{' '}
                    {(libraryTab === 'scales' ? activeScale.albums : activeChord.albums).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Fretboard Box Shape & Full Neck Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Cajas / Shapes en el Diapasón (D1=Índice · D2=Medio · D3=Anular · D4=Meñique)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-amber-600" /> Naranja = Tónica (R)
                  </span>
                  {blueNoteSemitones.length > 0 && (
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                      Azul = Nota de Blues (Blue Note)
                    </span>
                  )}
                  <span>Clic en cualquier nota para escucharla</span>
                </div>
              </div>

              {availableShapes.length > 0 && (
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950">
                  <button
                    type="button"
                    onClick={() => setFretboardMode('shape')}
                    className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      fretboardMode === 'shape'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Ver Caja / Shape (Dedos 1–4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFretboardMode('full')}
                    className={`px-3 py-1.5 text-xs font-semibold border-l border-slate-200 dark:border-slate-700 cursor-pointer ${
                      fretboardMode === 'full'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Mástil Completo (0–15)
                  </button>
                </div>
              )}
            </div>

            {availableShapes.length > 0 && fretboardMode === 'shape' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {availableShapes.map((sh, i) => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setSelectedShapeIdx(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        selectedShapeIdx === i
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sh.name}
                    </button>
                  ))}
                </div>
                {activeShape && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeShape.description}
                  </p>
                )}
              </div>
            )}

            <FretboardDiagram
              rootPitchClass={rootPc}
              semitones={currentSemitones}
              intervalLabels={currentIntervals}
              blueNoteSemitones={blueNoteSemitones}
              activeShape={activeShape}
              displayMode={availableShapes.length > 0 ? fretboardMode : 'full'}
              tuning={tuning}
            />
          </div>

          <NotationDisplay
            notes={generatedNotes}
            timeSignature="4/4"
            keySignature={NOTE_NAMES_SHARP[rootPc]}
            initialBpm={90}
          />
        </div>
      </div>
    </div>
  );
};
