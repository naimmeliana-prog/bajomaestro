import React from 'react';
import { TuningPreset } from '../types/music';
import { BassToneMode, playBassNote } from '../utils/audioEngine';
import { NOTE_NAMES_SHARP, TUNING_PRESETS } from '../utils/musicTheory';

interface FretboardDiagramProps {
  rootPitchClass: number;
  semitones: number[];
  intervalLabels?: string[];
  tuning?: TuningPreset;
  toneMode?: BassToneMode;
  maxFrets?: number;
}

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

export const FretboardDiagram: React.FC<FretboardDiagramProps> = ({
  rootPitchClass,
  semitones,
  intervalLabels,
  tuning = TUNING_PRESETS[0],
  toneMode = 'electric_finger',
  maxFrets = 15,
}) => {
  const stringCount = tuning.strings.length;
  const fretWidth = 54;
  const nutX = 54;
  const width = nutX + maxFrets * fretWidth + 24;
  const topPad = 26;
  const stringGap = 28;
  const height = topPad + (stringCount - 1) * stringGap + 34;

  // Map pitchClass -> interval label
  const pitchInfoMap = new Map<number, { isRoot: boolean; label: string }>();
  semitones.forEach((semi, idx) => {
    const pc = (rootPitchClass + semi) % 12;
    const label = intervalLabels?.[idx] ?? (semi === 0 ? 'R' : NOTE_NAMES_SHARP[pc]);
    if (!pitchInfoMap.has(pc)) {
      pitchInfoMap.set(pc, { isRoot: semi % 12 === 0, label });
    }
  });

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
              {FRET_MARKERS.includes(fretNum) && (
                fretNum === 12 ? (
                  <>
                    <circle cx={centerX} cy={midY - 14} r={4} className="fill-slate-300 dark:fill-slate-600/80" />
                    <circle cx={centerX} cy={midY + 14} r={4} className="fill-slate-300 dark:fill-slate-600/80" />
                  </>
                ) : (
                  <circle cx={centerX} cy={midY} r={4} className="fill-slate-300 dark:fill-slate-600/80" />
                )
              )}
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

        {/* Active Scale / Chord Notes on Fretboard */}
        {tuning.strings.map((str, sIdx) => {
          const y = topPad + sIdx * stringGap;
          return Array.from({ length: maxFrets + 1 }, (_, fret) => {
            const midi = str.midi + fret;
            const pc = ((midi % 12) + 12) % 12;
            const match = pitchInfoMap.get(pc);
            if (!match) return null;

            const cx = fret === 0 ? nutX - 16 : nutX + fret * fretWidth - fretWidth / 2;
            return (
              <g
                key={`${sIdx}-${fret}`}
                onClick={() => playBassNote(midi, 0.7, toneMode)}
                className="cursor-pointer group"
              >
                <circle
                  cx={cx}
                  cy={y}
                  r={11.5}
                  className={
                    match.isRoot
                      ? 'fill-amber-600 stroke-amber-300 dark:fill-amber-500 dark:stroke-amber-200'
                      : 'fill-slate-900 dark:fill-sky-600 stroke-white dark:stroke-slate-900 group-hover:fill-amber-600'
                  }
                  strokeWidth={1.6}
                />
                <text
                  x={cx}
                  y={y + 3.5}
                  textAnchor="middle"
                  className="fill-white font-mono font-bold"
                  fontSize="10"
                >
                  {match.label}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
