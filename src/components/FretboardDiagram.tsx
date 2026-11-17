import React from 'react';
import { BoxShapeDef, TuningPreset } from '../types/music';
import { BassToneMode, playBassNote } from '../utils/audioEngine';
import { midiToFrequency, midiToNoteInfo, NOTE_NAMES_SHARP, TUNING_PRESETS } from '../utils/musicTheory';

export interface FretboardClickedNote {
  midi: number;
  stringIndex: number;
  stringLabel: string;
  fret: number;
  noteIntl: string;
  noteEs: string;
  hz: number;
  interval: string;
}

interface FretboardDiagramProps {
  rootPitchClass: number;
  semitones: number[];
  intervalLabels?: string[];
  blueNoteSemitones?: number[];
  activeShape?: BoxShapeDef;
  displayMode?: 'full' | 'shape';
  labelDisplay?: 'interval' | 'note';
  activePitchClass?: number | null;
  activeFretCoord?: { stringIndex: number; fret: number } | null;
  tuning?: TuningPreset;
  toneMode?: BassToneMode;
  maxFrets?: number;
  onNoteClick?: (note: FretboardClickedNote) => void;
}

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

export const FretboardDiagram: React.FC<FretboardDiagramProps> = ({
  rootPitchClass,
  semitones,
  intervalLabels,
  blueNoteSemitones = [],
  activeShape,
  displayMode = 'full',
  labelDisplay = 'interval',
  activePitchClass = null,
  activeFretCoord = null,
  tuning = TUNING_PRESETS[0],
  toneMode = 'electric_finger',
  maxFrets = 15,
  onNoteClick,
}) => {
  const stringCount = tuning.strings.length;
  const fretWidth = 54;
  const nutX = 54;
  const width = nutX + maxFrets * fretWidth + 24;
  const topPad = 26;
  const stringGap = 30;
  const height = topPad + (stringCount - 1) * stringGap + 38;

  const blueSet = new Set(blueNoteSemitones.map((s) => (rootPitchClass + s) % 12));

  // Map pitchClass -> interval label
  const pitchInfoMap = new Map<number, { isRoot: boolean; isBlueNote: boolean; label: string }>();
  semitones.forEach((semi, idx) => {
    const pc = (rootPitchClass + semi) % 12;
    const label = intervalLabels?.[idx] ?? (semi === 0 ? 'R' : NOTE_NAMES_SHARP[pc]);
    if (!pitchInfoMap.has(pc)) {
      pitchInfoMap.set(pc, {
        isRoot: semi % 12 === 0,
        isBlueNote: blueSet.has(pc),
        label,
      });
    }
  });

  // Compute concrete fretboard coordinates if in Box Shape mode
  const shapePointsMap = new Map<
    string,
    { finger: string; interval: string; isRoot?: boolean; isBlueNote?: boolean }
  >();
  if (activeShape) {
    const bottomIndex = tuning.strings.length - 1;
    const targetStringIdx = Math.max(0, bottomIndex - activeShape.anchorStringFromBottom);
    const openPc = ((tuning.strings[targetStringIdx].midi % 12) + 12) % 12;
    let anchorFret = (rootPitchClass - openPc + 12) % 12;
    if (anchorFret < 2) anchorFret += 12;
    if (anchorFret > 12) anchorFret -= 12;
    if (anchorFret === 0) anchorFret = 12;

    activeShape.points.forEach((pt) => {
      const sIdx = bottomIndex - pt.stringFromBottom;
      const fret = anchorFret + pt.fretOffset;
      if (sIdx >= 0 && sIdx < tuning.strings.length && fret >= 0 && fret <= maxFrets) {
        shapePointsMap.set(`${sIdx}-${fret}`, {
          finger: pt.finger,
          interval: pt.interval,
          isRoot: pt.isRoot,
          isBlueNote: pt.isBlueNote,
        });
      }
    });
  }

  const showShapeOnly = displayMode === 'shape' && shapePointsMap.size > 0;

  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block select-none">
        {/* Fretboard Wood Surface */}
        <rect
          x={nutX}
          y={topPad - 10}
          width={maxFrets * fretWidth}
          height={(stringCount - 1) * stringGap + 20}
          rx={4}
          className="fill-slate-100 dark:fill-slate-800/75"
        />

        {/* Nut */}
        <rect
          x={nutX - 4}
          y={topPad - 11}
          width={5}
          height={(stringCount - 1) * stringGap + 22}
          rx={1}
          className="fill-slate-700 dark:fill-slate-300"
        />

        {/* Fret Wires & Inlay Dots */}
        {Array.from({ length: maxFrets }, (_, i) => i + 1).map((fretNum) => {
          const x = nutX + fretNum * fretWidth;
          const centerX = x - fretWidth / 2;
          const midY = topPad + ((stringCount - 1) * stringGap) / 2;
          return (
            <g key={fretNum}>
              <line
                x1={x}
                y1={topPad - 10}
                x2={x}
                y2={topPad + (stringCount - 1) * stringGap + 10}
                className="stroke-slate-300 dark:stroke-slate-600"
                strokeWidth={1.6}
              />
              {FRET_MARKERS.includes(fretNum) &&
                (fretNum === 12 ? (
                  <>
                    <circle cx={centerX} cy={midY - 14} r={4} className="fill-slate-300 dark:fill-slate-600/80" />
                    <circle cx={centerX} cy={midY + 14} r={4} className="fill-slate-300 dark:fill-slate-600/80" />
                  </>
                ) : (
                  <circle cx={centerX} cy={midY} r={4} className="fill-slate-300 dark:fill-slate-600/80" />
                ))}
              <text
                x={centerX}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 font-mono tabular-nums"
                fontSize="10.5"
              >
                {fretNum}
              </text>
            </g>
          );
        })}

        {/* Strings */}
        {tuning.strings.map((str, sIdx) => {
          const y = topPad + sIdx * stringGap;
          const thickness = 1.4 + sIdx * 0.45;
          return (
            <g key={str.label + sIdx}>
              <text
                x={16}
                y={y + 4}
                className="fill-slate-600 dark:fill-slate-300 font-mono font-bold"
                fontSize="12"
              >
                {str.label}
              </text>
              <line
                x1={nutX - 4}
                y1={y}
                x2={nutX + maxFrets * fretWidth}
                y2={y}
                className="stroke-slate-400 dark:stroke-slate-500"
                strokeWidth={thickness}
              />
            </g>
          );
        })}

        {/* Active Notes / Shapes on Fretboard */}
        {tuning.strings.map((str, sIdx) => {
          const y = topPad + sIdx * stringGap;
          return Array.from({ length: maxFrets + 1 }, (_, fret) => {
            const midi = str.midi + fret;
            const pc = ((midi % 12) + 12) % 12;
            const match = pitchInfoMap.get(pc);
            const shapePt = shapePointsMap.get(`${sIdx}-${fret}`);

            if (!match && !shapePt) return null;
            if (showShapeOnly && !shapePt) return null;

            const isRoot = shapePt ? shapePt.isRoot : match?.isRoot;
            const isBlueNote = shapePt ? shapePt.isBlueNote : match?.isBlueNote;
            const isCoordActive =
              activeFretCoord !== null &&
              activeFretCoord.stringIndex === sIdx &&
              activeFretCoord.fret === fret;
            const isPitchHighlighted =
              activePitchClass !== null && activePitchClass === pc;

            const cx = fret === 0 ? nutX - 16 : nutX + fret * fretWidth - fretWidth / 2;

            const circleFill = isCoordActive
              ? 'fill-emerald-500 stroke-white dark:stroke-slate-950'
              : isPitchHighlighted
                ? 'fill-emerald-600 stroke-emerald-200 dark:fill-emerald-500 dark:stroke-emerald-100'
                : isRoot
                  ? 'fill-amber-600 stroke-amber-200 dark:fill-amber-500 dark:stroke-amber-200'
                  : isBlueNote
                    ? 'fill-sky-600 stroke-sky-200 dark:fill-sky-500 dark:stroke-sky-200'
                    : 'fill-slate-900 dark:fill-slate-700 stroke-white dark:stroke-slate-900 group-hover:fill-amber-600';

            const intervalStr = shapePt ? shapePt.interval : match?.label || '';
            const labelText =
              labelDisplay === 'note' ? NOTE_NAMES_SHARP[pc] : intervalStr;

            return (
              <g
                key={`${sIdx}-${fret}`}
                onClick={() => {
                  playBassNote(midi, 0.75, toneMode);
                  if (onNoteClick) {
                    const info = midiToNoteInfo(midi, false);
                    onNoteClick({
                      midi,
                      stringIndex: sIdx,
                      stringLabel: str.label,
                      fret,
                      noteIntl: info.intl,
                      noteEs: info.es,
                      hz: midiToFrequency(midi),
                      interval: intervalStr,
                    });
                  }
                }}
                className="cursor-pointer group"
              >
                {(isCoordActive || isPitchHighlighted) && (
                  <circle
                    cx={cx}
                    cy={y}
                    r={16}
                    className="fill-none stroke-emerald-400"
                    strokeWidth={2}
                    opacity={0.85}
                  />
                )}
                <circle cx={cx} cy={y} r={12.5} className={circleFill} strokeWidth={1.6} />
                <text
                  x={cx}
                  y={shapePt ? y + 1.5 : y + 3.5}
                  textAnchor="middle"
                  className="fill-white font-mono font-bold"
                  fontSize="9.5"
                >
                  {labelText}
                </text>
                {shapePt && (
                  <text
                    x={cx}
                    y={y + 9.5}
                    textAnchor="middle"
                    className="fill-amber-200 font-mono font-semibold"
                    fontSize="7.5"
                  >
                    D{shapePt.finger}
                  </text>
                )}
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
