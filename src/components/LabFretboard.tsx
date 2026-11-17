import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Guitar, Layers, Mic, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import { useTheorySelection } from '../context/TheorySelectionContext';
import { CHORDS_LIBRARY, SCALES_AND_MODES } from '../data/theoryLibrary';
import { BassToneMode, playBassNote } from '../utils/audioEngine';
import {
  findBestStringAndFret,
  NOTE_NAMES_ES_SHARP,
  NOTE_NAMES_SHARP,
  TUNING_PRESETS,
} from '../utils/musicTheory';
import { FretboardClickedNote, FretboardDiagram } from './FretboardDiagram';

interface LabFretboardProps {
  liveMicPitchClass?: number | null;
  liveMicNoteLabel?: string | null;
  detectedChordSymbol?: string | null;
  onOpenLibrary?: () => void;
}

function parseDetectedChordToSelection(chordSymbol: string): {
  rootPc: number;
  chordId: string;
} | null {
  if (!chordSymbol || chordSymbol === '—') return null;
  const match = chordSymbol.match(/^([A-G]#?)(.*)$/);
  if (!match) return null;
  const rootIdx = (NOTE_NAMES_SHARP as readonly string[]).indexOf(match[1]);
  if (rootIdx < 0) return null;
  const suffix = match[2];
  const matchedChord =
    CHORDS_LIBRARY.find((c) => c.symbolSuffix === suffix) ||
    CHORDS_LIBRARY.find((c) => c.symbolSuffix === '');
  return {
    rootPc: rootIdx,
    chordId: matchedChord ? matchedChord.id : CHORDS_LIBRARY[0].id,
  };
}

export const LabFretboard: React.FC<LabFretboardProps> = ({
  liveMicPitchClass = null,
  liveMicNoteLabel = null,
  detectedChordSymbol = null,
  onOpenLibrary,
}) => {
  const {
    libraryTab,
    setLibraryTab,
    rootPc,
    setRootPc,
    tuningId,
    setTuningId,
    selectedScaleId,
    setSelectedScaleId,
    selectedChordId,
    setSelectedChordId,
    fretboardMode,
    setFretboardMode,
    selectedShapeIdx,
    setSelectedShapeIdx,
    toneMode,
    setToneMode,
  } = useTheorySelection();

  const [labelDisplay, setLabelDisplay] = useState<'interval' | 'note'>('interval');
  const [highlightMicNote, setHighlightMicNote] = useState(true);
  const [selectedPitchFilter, setSelectedPitchFilter] = useState<number | null>(null);
  const [clickedNoteInfo, setClickedNoteInfo] = useState<FretboardClickedNote | null>(null);

  // Sequential fretboard playback state
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [activeSeqStep, setActiveSeqStep] = useState(-1);
  const [activeFretCoord, setActiveFretCoord] = useState<{ stringIndex: number; fret: number } | null>(
    null
  );
  const timersRef = useRef<number[]>([]);

  const tuning = TUNING_PRESETS.find((t) => t.id === tuningId) || TUNING_PRESETS[0];
  const activeScale =
    SCALES_AND_MODES.find((s) => s.id === selectedScaleId) || SCALES_AND_MODES[0];
  const activeChord =
    CHORDS_LIBRARY.find((c) => c.id === selectedChordId) || CHORDS_LIBRARY[0];

  const availableShapes =
    libraryTab === 'scales' ? activeScale.shapes || [] : activeChord.shapes || [];
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

  const stopSequence = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setIsPlayingSeq(false);
    setActiveSeqStep(-1);
    setActiveFretCoord(null);
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Stop playback if selection changes
  useEffect(() => {
    stopSequence();
    setSelectedPitchFilter(null);
  }, [libraryTab, selectedScaleId, selectedChordId, rootPc, tuningId, selectedShapeIdx]);

  const sequenceSteps = useMemo(() => {
    const bottomIndex = tuning.strings.length - 1;
    if (fretboardMode === 'shape' && activeShape && activeShape.points.length > 0) {
      const targetStringIdx = Math.max(0, bottomIndex - activeShape.anchorStringFromBottom);
      const openPc = ((tuning.strings[targetStringIdx].midi % 12) + 12) % 12;
      let anchorFret = (rootPc - openPc + 12) % 12;
      if (anchorFret < 2) anchorFret += 12;
      if (anchorFret > 12) anchorFret -= 12;
      if (anchorFret === 0) anchorFret = 12;

      return activeShape.points.map((pt) => {
        const sIdx = bottomIndex - pt.stringFromBottom;
        const fret = Math.max(0, anchorFret + pt.fretOffset);
        const midi = tuning.strings[sIdx].midi + fret;
        return { midi, stringIndex: sIdx, fret, interval: pt.interval };
      });
    }

    const semis = libraryTab === 'scales' ? [...activeScale.semitones, 12] : activeChord.semitones;
    return semis.map((semi, idx) => {
      const midi = baseMidi + semi;
      const pos = findBestStringAndFret(midi, tuning);
      return {
        midi,
        stringIndex: pos.stringIndex,
        fret: pos.fret,
        interval: currentIntervals[idx] ?? 'R',
      };
    });
  }, [
    tuning,
    fretboardMode,
    activeShape,
    rootPc,
    libraryTab,
    activeScale.semitones,
    activeChord.semitones,
    baseMidi,
    currentIntervals,
  ]);

  const handleTogglePlaySequence = () => {
    if (isPlayingSeq) {
      stopSequence();
      return;
    }
    if (!sequenceSteps.length) return;
    setIsPlayingSeq(true);

    const stepMs = 310;
    sequenceSteps.forEach((step, idx) => {
      const id = window.setTimeout(() => {
        setActiveSeqStep(idx);
        setActiveFretCoord({ stringIndex: step.stringIndex, fret: step.fret });
        playBassNote(step.midi, 0.48, toneMode);
      }, idx * stepMs);
      timersRef.current.push(id);
    });

    const endId = window.setTimeout(() => {
      stopSequence();
    }, sequenceSteps.length * stepMs + 220);
    timersRef.current.push(endId);
  };

  const parsedDetected = useMemo(
    () => (detectedChordSymbol ? parseDetectedChordToSelection(detectedChordSymbol) : null),
    [detectedChordSymbol]
  );

  const effectiveActivePitchClass =
    selectedPitchFilter !== null
      ? selectedPitchFilter
      : highlightMicNote && liveMicPitchClass !== null
        ? liveMicPitchClass
        : null;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Guitar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Mástil Interactivo Sincronizado con la Biblioteca
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualiza en tiempo real las posiciones en las cuerdas de cualquier escala, modo o acorde seleccionado desde la Biblioteca
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {parsedDetected && (
            <button
              type="button"
              onClick={() => {
                setLibraryTab('chords');
                setRootPc(parsedDetected.rootPc);
                setSelectedChordId(parsedDetected.chordId);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/12 border border-sky-500/40 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-600/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar acorde detectado: {detectedChordSymbol}
            </button>
          )}

          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-500 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              Abrir Biblioteca completa
            </button>
          )}

          <button
            type="button"
            onClick={handleTogglePlaySequence}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isPlayingSeq
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isPlayingSeq ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlayingSeq ? 'Detener' : `Tocar ${libraryTab === 'scales' ? 'Escala' : 'Arpegio'}`}
          </button>
        </div>
      </div>

      {/* Selector Bar (Synced with LibraryView) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
        {/* Library Category Toggle */}
        <div className="lg:col-span-3 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tipo de Biblioteca
          </div>
          <div className="inline-flex w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setLibraryTab('scales')}
              className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                libraryTab === 'scales'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Escalas / Modos
            </button>
            <button
              type="button"
              onClick={() => setLibraryTab('chords')}
              className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                libraryTab === 'chords'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Acordes
            </button>
          </div>
        </div>

        {/* Scale / Mode / Chord Dropdown */}
        <div className="lg:col-span-4 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {libraryTab === 'scales' ? 'Escala o Modo Seleccionado' : 'Acorde / Arpegio Seleccionado'}
          </label>
          {libraryTab === 'scales' ? (
            <select
              value={activeScale.id}
              onChange={(e) => setSelectedScaleId(e.target.value)}
              aria-label="Seleccionar escala o modo en laboratorio"
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {SCALES_AND_MODES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameEs} ({s.category})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={activeChord.id}
              onChange={(e) => setSelectedChordId(e.target.value)}
              aria-label="Seleccionar acorde en laboratorio"
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {CHORDS_LIBRARY.map((c) => (
                <option key={c.id} value={c.id}>
                  {NOTE_NAMES_SHARP[rootPc]}
                  {c.symbolSuffix} · {c.nameEs}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tuning & Tone Selectors */}
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cuerdas y Afinación
          </label>
          <select
            value={tuningId}
            onChange={(e) => setTuningId(e.target.value)}
            aria-label="Afinación del mástil"
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            {TUNING_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Timbre Web Audio
          </label>
          <select
            value={toneMode}
            onChange={(e) => setToneMode(e.target.value as BassToneMode)}
            aria-label="Timbre del mástil interactivo"
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="electric_finger">Eléctrico · Dedos</option>
            <option value="electric_pick">Eléctrico · Púa</option>
            <option value="electric_slap">Eléctrico · Slap</option>
            <option value="acoustic_upright">Acústico / Contrabajo</option>
          </select>
        </div>
      </div>

      {/* Root Selector + Display Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Tónica:
          </span>
          {NOTE_NAMES_SHARP.map((n, pc) => (
            <button
              key={n}
              type="button"
              onClick={() => setRootPc(pc)}
              className={`px-2 py-1 rounded-md font-mono text-xs font-bold border transition-colors cursor-pointer ${
                rootPc === pc
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Interval vs Note Names */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setLabelDisplay('interval')}
              className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                labelDisplay === 'interval'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Intervalos
            </button>
            <button
              type="button"
              onClick={() => setLabelDisplay('note')}
              className={`px-2.5 py-1 text-xs font-semibold border-l border-slate-200 dark:border-slate-700 cursor-pointer ${
                labelDisplay === 'note'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Notas ({NOTE_NAMES_SHARP[rootPc]}...)
            </button>
          </div>

          {/* Box Shape vs Full Neck */}
          {availableShapes.length > 0 && (
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setFretboardMode('shape')}
                className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  fretboardMode === 'shape'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Caja / Shape
              </button>
              <button
                type="button"
                onClick={() => setFretboardMode('full')}
                className={`px-2.5 py-1 text-xs font-semibold border-l border-slate-200 dark:border-slate-700 cursor-pointer ${
                  fretboardMode === 'full'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Mástil 0–15
              </button>
            </div>
          )}

          {liveMicPitchClass !== null && (
            <button
              type="button"
              onClick={() => setHighlightMicNote((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                highlightMicNote
                  ? 'border-emerald-500 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Mic: {liveMicNoteLabel}
            </button>
          )}
        </div>
      </div>

      {/* Multi-shape switcher if available */}
      {availableShapes.length > 0 && fretboardMode === 'shape' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            Posiciones:
          </span>
          {availableShapes.map((sh, i) => (
            <button
              key={sh.id}
              type="button"
              onClick={() => setSelectedShapeIdx(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                selectedShapeIdx === i
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {sh.name}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Note Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {currentSemitones.map((semi, idx) => {
          const pc = (rootPc + semi) % 12;
          const isBlue =
            libraryTab === 'scales' && Boolean(activeScale.blueNoteIndices?.includes(idx));
          const isHighlighted = selectedPitchFilter === pc || activeSeqStep === idx;
          return (
            <button
              key={`${semi}-${idx}`}
              type="button"
              onClick={() => {
                playBassNote(baseMidi + semi, 0.72, toneMode);
                setSelectedPitchFilter((prev) => (prev === pc ? null : pc));
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                isHighlighted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isBlue
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-700 dark:text-sky-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500'
              }`}
            >
              <span className="opacity-75">{currentIntervals[idx]}</span>
              <span>{NOTE_NAMES_SHARP[pc]}</span>
              <span className="font-sans font-normal text-[10px] opacity-80">
                ({NOTE_NAMES_ES_SHARP[pc]})
              </span>
            </button>
          );
        })}
        {selectedPitchFilter !== null && (
          <button
            type="button"
            onClick={() => setSelectedPitchFilter(null)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer ml-1"
          >
            Limpiar resaltado
          </button>
        )}
      </div>

      {/* Fretboard SVG Diagram */}
      <FretboardDiagram
        rootPitchClass={rootPc}
        semitones={currentSemitones}
        intervalLabels={currentIntervals}
        blueNoteSemitones={blueNoteSemitones}
        activeShape={activeShape}
        displayMode={availableShapes.length > 0 ? fretboardMode : 'full'}
        labelDisplay={labelDisplay}
        activePitchClass={effectiveActivePitchClass}
        activeFretCoord={activeFretCoord}
        tuning={tuning}
        toneMode={toneMode}
        onNoteClick={(note) => setClickedNoteInfo(note)}
      />

      {/* Footer Inspection Strip & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-amber-600 dark:text-amber-400">Naranja:</strong> Tónica (R)
          </span>
          {blueNoteSemitones.length > 0 && (
            <span>
              <strong className="text-sky-600 dark:text-sky-400">Azul:</strong> Nota de Blues
            </span>
          )}
          <span>
            <strong className="text-emerald-600 dark:text-emerald-400">Verde:</strong> Nota activa / filtrada
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
          {clickedNoteInfo ? (
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              {clickedNoteInfo.noteIntl} ({clickedNoteInfo.noteEs}) · Cuerda {clickedNoteInfo.stringLabel} · Traste{' '}
              {clickedNoteInfo.fret} · Intervalo {clickedNoteInfo.interval} · {clickedNoteInfo.hz.toFixed(2)} Hz
            </span>
          ) : (
            <span>Haz clic en cualquier posición del mástil o en un intervalo para oír y analizar la nota</span>
          )}
        </div>
      </div>
    </section>
  );
};
