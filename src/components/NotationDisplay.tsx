import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Pause, Play, Repeat, Volume2 } from 'lucide-react';
import { NoteEvent, TimeSignature } from '../types/music';
import { BassSequencePlayer, BassToneMode, playBassNote } from '../utils/audioEngine';
import {
  findBestStringAndFret,
  KEY_FLAT_PREFERENCE,
  midiToNoteInfo,
  midiToWrittenBassClefPosition,
  TUNING_PRESETS,
} from '../utils/musicTheory';

interface NotationDisplayProps {
  notes: NoteEvent[];
  timeSignature: TimeSignature;
  keySignature: string;
  initialBpm: number;
  defaultDisplayMode?: 'both' | 'staff' | 'tab';
  defaultToneMode?: BassToneMode;
  onBpmAchieved?: (bpm: number) => void;
}

const TECHNIQUE_BADGE: Record<string, string> = {
  slap: 'T',
  pop: 'P',
  hammer: 'H',
  pull: 'PO',
  slide: '/',
  ghost: 'X',
  harmonic: '◊',
  tap: 'TAP',
  staccato: '.',
  accent: '>',
};

export const NotationDisplay: React.FC<NotationDisplayProps> = ({
  notes,
  timeSignature,
  keySignature,
  initialBpm,
  defaultDisplayMode = 'both',
  defaultToneMode = 'electric_finger',
  onBpmAchieved,
}) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [displayMode, setDisplayMode] = useState<'both' | 'staff' | 'tab'>(defaultDisplayMode);
  const [toneMode, setToneMode] = useState<BassToneMode>(defaultToneMode);
  const [loop, setLoop] = useState(true);
  const [clickTrack, setClickTrack] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const playerRef = useRef<BassSequencePlayer | null>(null);
  const preferFlats = KEY_FLAT_PREFERENCE[keySignature] ?? false;
  const tuning = TUNING_PRESETS[0];

  useEffect(() => {
    setBpm(initialBpm);
  }, [initialBpm, notes]);

  useEffect(() => {
    playerRef.current = new BassSequencePlayer();
    return () => {
      playerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    playerRef.current?.stop();
    setIsPlaying(false);
    setActiveIndex(-1);
  }, [notes]);

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      setActiveIndex(-1);
    } else {
      setIsPlaying(true);
      onBpmAchieved?.(bpm);
      playerRef.current.play(notes, bpm, toneMode, {
        loop,
        clickTrack,
        onStep: (idx) => setActiveIndex(idx),
        onFinish: () => {
          setIsPlaying(false);
          setActiveIndex(-1);
        },
      });
    }
  };

  const beatsPerBar = useMemo(() => {
    if (timeSignature === '3/4') return 3;
    if (timeSignature === '2/4') return 2;
    if (timeSignature === '5/4') return 5;
    if (timeSignature === '6/8') return 3;
    if (timeSignature === '12/8') return 6;
    if (timeSignature === '7/8') return 3.5;
    if (timeSignature === '7/4') return 7;
    return 4;
  }, [timeSignature]);

  // Layout geometry
  const noteSpacing = 54;
  const leftMargin = 78;
  const svgWidth = Math.max(660, leftMargin + notes.length * noteSpacing + 40);
  const showStaff = displayMode !== 'tab';
  const showTab = displayMode !== 'staff';
  const staffTopY = 46;
  const lineGap = 11; // 5 lines: y = 46, 57, 68, 79, 90 (bottom line G2 = 90)
  const bottomStaffLineY = staffTopY + 4 * lineGap;
  const tabTopY = showStaff ? 142 : 44;
  const tabLineGap = 16;
  const svgHeight = showTab ? tabTopY + 3 * tabLineGap + 38 : 132;

  // Compute barline positions
  const barlineXs = useMemo(() => {
    const xs: number[] = [];
    let acc = 0;
    notes.forEach((n, idx) => {
      acc += n.durationBeats;
      if (acc >= beatsPerBar - 0.01 && idx < notes.length - 1) {
        xs.push(leftMargin + idx * noteSpacing + noteSpacing * 0.56);
        acc = 0;
      }
    });
    return xs;
  }, [notes, beatsPerBar]);

  const [tsNum, tsDen] = timeSignature.split('/');

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      {/* Control Toolbar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Detener' : 'Reproducir'}
          </button>

          <button
            type="button"
            onClick={() => setLoop((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              loop
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            Bucle
          </button>

          <button
            type="button"
            onClick={() => setClickTrack((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              clickTrack
                ? 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Pulso guía
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Tempo: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{bpm} BPM</span>
            </label>
            <input
              type="range"
              min={40}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-24 accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={toneMode}
            onChange={(e) => setToneMode(e.target.value as BassToneMode)}
            aria-label="Timbre del bajo"
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="electric_finger">Eléctrico · Dedos</option>
            <option value="electric_pick">Eléctrico · Púa</option>
            <option value="electric_slap">Eléctrico · Slap</option>
            <option value="acoustic_upright">Acústico / Contrabajo</option>
          </select>

          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setDisplayMode('both')}
              className={`px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                displayMode === 'both'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              Partitura + TAB
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('staff')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border-l border-slate-200 dark:border-slate-700 cursor-pointer ${
                displayMode === 'staff'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              {displayMode === 'staff' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              Solo Partitura
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('tab')}
              className={`px-2.5 py-1.5 text-xs font-medium border-l border-slate-200 dark:border-slate-700 cursor-pointer ${
                displayMode === 'tab'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              Solo TAB
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Staff + TAB */}
      <div className="overflow-x-auto px-3 py-4">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block select-none"
        >
          {/* BASS CLEF STAFF */}
          {showStaff && (
            <g>
              {[0, 1, 2, 3, 4].map((lineIdx) => {
                const y = staffTopY + lineIdx * lineGap;
                return (
                  <line
                    key={lineIdx}
                    x1={12}
                    y1={y}
                    x2={svgWidth - 16}
                    y2={y}
                    className="stroke-slate-300 dark:stroke-slate-700"
                    strokeWidth={1.2}
                  />
                );
              })}

              {/* Bass Clef Symbol */}
              <text
                x={16}
                y={staffTopY + 34}
                className="fill-slate-800 dark:fill-slate-200"
                fontSize="42"
                fontFamily="serif"
              >
                𝄢
              </text>

              {/* Time Signature */}
              <text
                x={49}
                y={staffTopY + 18}
                className="fill-slate-800 dark:fill-slate-200 font-mono font-bold"
                fontSize="16"
                textAnchor="middle"
              >
                {tsNum}
              </text>
              <text
                x={49}
                y={staffTopY + 38}
                className="fill-slate-800 dark:fill-slate-200 font-mono font-bold"
                fontSize="16"
                textAnchor="middle"
              >
                {tsDen}
              </text>

              {/* Barlines */}
              {barlineXs.map((bx, i) => (
                <line
                  key={`bar-${i}`}
                  x1={bx}
                  y1={staffTopY}
                  x2={bx}
                  y2={bottomStaffLineY}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth={1.3}
                />
              ))}
              <line
                x1={svgWidth - 18}
                y1={staffTopY}
                x2={svgWidth - 18}
                y2={bottomStaffLineY}
                className="stroke-slate-700 dark:stroke-slate-300"
                strokeWidth={2.5}
              />
            </g>
          )}

          {/* TAB STAFF (G D A E) */}
          {showTab && (
            <g>
              {['G', 'D', 'A', 'E'].map((strLabel, idx) => {
                const y = tabTopY + idx * tabLineGap;
                return (
                  <g key={strLabel}>
                    <line
                      x1={12}
                      y1={y}
                      x2={svgWidth - 16}
                      y2={y}
                      className="stroke-slate-300 dark:stroke-slate-700"
                      strokeWidth={1.1}
                    />
                    <text
                      x={16}
                      y={y + 4}
                      className="fill-slate-500 dark:fill-slate-400 font-mono font-semibold"
                      fontSize="11"
                    >
                      {strLabel}
                    </text>
                  </g>
                );
              })}

              <text
                x={44}
                y={tabTopY + 29}
                className="fill-slate-400 dark:fill-slate-500 font-mono font-bold"
                fontSize="11"
                letterSpacing="1"
              >
                TAB
              </text>

              {barlineXs.map((bx, i) => (
                <line
                  key={`tbar-${i}`}
                  x1={bx}
                  y1={tabTopY}
                  x2={bx}
                  y2={tabTopY + 3 * tabLineGap}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth={1.2}
                />
              ))}
            </g>
          )}

          {/* NOTES & FRET NUMBERS */}
          {notes.map((ev, idx) => {
            const x = leftMargin + idx * noteSpacing;
            const isActive = idx === activeIndex;
            const pos = findBestStringAndFret(ev.midi, tuning, ev.stringNum, ev.fret);
            const clefPos = midiToWrittenBassClefPosition(ev.midi, preferFlats);
            const noteInfo = midiToNoteInfo(ev.midi, preferFlats);

            // Each step = half a lineGap (5.5px). Step 0 = bottom line (G2), Step 8 = top line (A3)
            const noteY = bottomStaffLineY - clefPos.stepFromBottomLine * (lineGap / 2);
            const isHollow = ev.durationBeats >= 2;
            const isWhole = ev.durationBeats >= 4;
            const isEighth = ev.durationBeats <= 0.5 && ev.durationBeats > 0.25;
            const isSixteenth = ev.durationBeats <= 0.25;
            const isDotted = Math.abs(ev.durationBeats - 1.5) < 0.05 || Math.abs(ev.durationBeats - 3) < 0.05;
            const stemUp = clefPos.stepFromBottomLine < 4;

            // Ledger lines if below step 0 (steps -2, -4...) or above step 8 (steps 10, 12...)
            const ledgerLines: number[] = [];
            if (!ev.isRest) {
              if (clefPos.stepFromBottomLine <= -2) {
                for (let s = -2; s >= clefPos.stepFromBottomLine; s -= 2) {
                  ledgerLines.push(bottomStaffLineY - s * (lineGap / 2));
                }
              }
              if (clefPos.stepFromBottomLine >= 10) {
                for (let s = 10; s <= clefPos.stepFromBottomLine; s += 2) {
                  ledgerLines.push(bottomStaffLineY - s * (lineGap / 2));
                }
              }
            }

            const tabY = tabTopY + pos.stringIndex * tabLineGap;
            const techTag = ev.technique && ev.technique !== 'normal' ? TECHNIQUE_BADGE[ev.technique] : '';

            return (
              <g
                key={idx}
                onClick={() => {
                  if (!ev.isRest) {
                    setActiveIndex(idx);
                    playBassNote(ev.midi, 0.55, toneMode, ev.technique ?? 'normal');
                  }
                }}
                className="cursor-pointer group"
              >
                {/* Active playhead column highlight */}
                {isActive && (
                  <rect
                    x={x - 16}
                    y={14}
                    width={32}
                    height={svgHeight - 24}
                    rx={6}
                    className="fill-amber-500/15 stroke-amber-500/40"
                    strokeWidth={1}
                  />
                )}

                {/* Chord Symbol */}
                {ev.chordSymbol && (
                  <text
                    x={x}
                    y={22}
                    textAnchor="middle"
                    className="fill-amber-700 dark:fill-amber-400 font-display font-bold"
                    fontSize="12.5"
                  >
                    {ev.chordSymbol}
                  </text>
                )}

                {/* Staff Note or Rest */}
                {showStaff && (
                  <g>
                    {ev.isRest ? (
                      <text
                        x={x}
                        y={staffTopY + 28}
                        textAnchor="middle"
                        className={
                          isActive
                            ? 'fill-amber-600 dark:fill-amber-400'
                            : 'fill-slate-600 dark:fill-slate-400'
                        }
                        fontSize="20"
                      >
                        {ev.durationBeats >= 2 ? '𝄼' : ev.durationBeats >= 1 ? '𝄽' : '𝄾'}
                      </text>
                    ) : (
                      <g>
                        {ledgerLines.map((ly, li) => (
                          <line
                            key={li}
                            x1={x - 10}
                            y1={ly}
                            x2={x + 10}
                            y2={ly}
                            className="stroke-slate-400 dark:stroke-slate-600"
                            strokeWidth={1.2}
                          />
                        ))}

                        {clefPos.accidentalSymbol && (
                          <text
                            x={x - 14}
                            y={noteY + 4}
                            className="fill-slate-700 dark:fill-slate-300 font-sans font-bold"
                            fontSize="12"
                          >
                            {clefPos.accidentalSymbol === '#' ? '♯' : '♭'}
                          </text>
                        )}

                        {ev.technique === 'ghost' ? (
                          <text
                            x={x}
                            y={noteY + 5}
                            textAnchor="middle"
                            className={
                              isActive
                                ? 'fill-amber-600 dark:fill-amber-400 font-mono font-bold'
                                : 'fill-slate-700 dark:fill-slate-300 font-mono font-bold'
                            }
                            fontSize="14"
                          >
                            ×
                          </text>
                        ) : (
                          <ellipse
                            cx={x}
                            cy={noteY}
                            rx={6.2}
                            ry={4.6}
                            transform={`rotate(-18 ${x} ${noteY})`}
                            className={
                              isActive
                                ? isHollow
                                  ? 'fill-white dark:fill-slate-900 stroke-amber-500'
                                  : 'fill-amber-500 stroke-amber-500'
                                : isHollow
                                  ? 'fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200 group-hover:stroke-amber-500'
                                  : 'fill-slate-900 dark:fill-slate-100 stroke-slate-900 dark:stroke-slate-100 group-hover:fill-amber-500 group-hover:stroke-amber-500'
                            }
                            strokeWidth={1.8}
                          />
                        )}

                        {isDotted && (
                          <circle
                            cx={x + 10}
                            cy={noteY - 1}
                            r={2}
                            className="fill-slate-700 dark:fill-slate-300"
                          />
                        )}

                        {!isWhole && (
                          <line
                            x1={stemUp ? x + 5.5 : x - 5.5}
                            y1={noteY}
                            x2={stemUp ? x + 5.5 : x - 5.5}
                            y2={stemUp ? noteY - 28 : noteY + 28}
                            className={
                              isActive
                                ? 'stroke-amber-500'
                                : 'stroke-slate-800 dark:stroke-slate-200'
                            }
                            strokeWidth={1.5}
                          />
                        )}

                        {(isEighth || isSixteenth) && (
                          <path
                            d={
                              stemUp
                                ? `M ${x + 5.5} ${noteY - 28} Q ${x + 14} ${noteY - 21} ${x + 11} ${noteY - 14}`
                                : `M ${x - 5.5} ${noteY + 28} Q ${x + 4} ${noteY + 21} ${x + 1} ${noteY + 14}`
                            }
                            fill="none"
                            className={
                              isActive
                                ? 'stroke-amber-500'
                                : 'stroke-slate-800 dark:stroke-slate-200'
                            }
                            strokeWidth={1.8}
                          />
                        )}
                        {isSixteenth && (
                          <path
                            d={
                              stemUp
                                ? `M ${x + 5.5} ${noteY - 21} Q ${x + 14} ${noteY - 14} ${x + 11} ${noteY - 7}`
                                : `M ${x - 5.5} ${noteY + 21} Q ${x + 4} ${noteY + 14} ${x + 1} ${noteY + 7}`
                            }
                            fill="none"
                            className={
                              isActive
                                ? 'stroke-amber-500'
                                : 'stroke-slate-800 dark:stroke-slate-200'
                            }
                            strokeWidth={1.8}
                          />
                        )}

                        {techTag && (
                          <text
                            x={x}
                            y={staffTopY - 8}
                            textAnchor="middle"
                            className="fill-sky-600 dark:fill-sky-400 font-mono font-bold"
                            fontSize="10"
                          >
                            {techTag}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                )}

                {/* TAB Fret Number */}
                {showTab && !ev.isRest && (
                  <g>
                    <rect
                      x={x - 9}
                      y={tabY - 8}
                      width={18}
                      height={16}
                      rx={3}
                      className={
                        isActive
                          ? 'fill-amber-600'
                          : 'fill-white dark:fill-slate-900'
                      }
                    />
                    <text
                      x={x}
                      y={tabY + 4}
                      textAnchor="middle"
                      className={`font-mono font-bold tabular-nums ${
                        isActive
                          ? 'fill-white'
                          : 'fill-slate-900 dark:fill-slate-100 group-hover:fill-amber-600'
                      }`}
                      fontSize="12"
                    >
                      {ev.technique === 'ghost' ? 'X' : pos.fret}
                    </text>
                    <text
                      x={x}
                      y={tabTopY + 3 * tabLineGap + 22}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500 font-mono"
                      fontSize="9.5"
                    >
                      {noteInfo.intlBase}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
