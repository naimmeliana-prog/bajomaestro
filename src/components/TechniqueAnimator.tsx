import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { AnimatorPreset, TechniqueStep } from '../data/techniques';
import { BassSequencePlayer } from '../utils/audioEngine';
import { findBestStringAndFret, midiToNoteInfo, TUNING_PRESETS } from '../utils/musicTheory';

interface TechniqueAnimatorProps {
  preset: AnimatorPreset;
  step: TechniqueStep;
}

const STRING_LABELS = ['G (1ª)', 'D (2ª)', 'A (3ª)', 'E (4ª)'];

export const TechniqueAnimator: React.FC<TechniqueAnimatorProps> = ({ preset, step }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<0.6 | 1.0>(1.0);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number>(-1);

  const playerRef = useRef<BassSequencePlayer | null>(null);
  const tuning = TUNING_PRESETS[0];

  useEffect(() => {
    playerRef.current = new BassSequencePlayer();
    return () => {
      playerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    playerRef.current?.stop();
    setIsPlaying(false);
    setActiveNoteIdx(-1);
  }, [step, preset]);

  const effectiveBpm = Math.max(36, Math.round(step.bpm * speedMultiplier));

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      setActiveNoteIdx(-1);
    } else {
      setIsPlaying(true);
      playerRef.current.play(step.notes, effectiveBpm, step.toneMode, {
        loop: true,
        clickTrack: true,
        onStep: (idx) => setActiveNoteIdx(idx),
        onFinish: () => {
          setIsPlaying(false);
          setActiveNoteIdx(-1);
        },
      });
    }
  };

  const handleRestart = () => {
    playerRef.current?.stop();
    setActiveNoteIdx(-1);
    setIsPlaying(true);
    playerRef.current?.play(step.notes, effectiveBpm, step.toneMode, {
      loop: true,
      clickTrack: true,
      onStep: (idx) => setActiveNoteIdx(idx),
      onFinish: () => {
        setIsPlaying(false);
        setActiveNoteIdx(-1);
      },
    });
  };

  // Update playback tempo live if speed changes while playing
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;
    playerRef.current.play(step.notes, effectiveBpm, step.toneMode, {
      loop: true,
      clickTrack: true,
      onStep: (idx) => setActiveNoteIdx(idx),
      onFinish: () => {
        setIsPlaying(false);
        setActiveNoteIdx(-1);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedMultiplier]);

  const activeEvent = activeNoteIdx >= 0 ? step.notes[activeNoteIdx] : step.notes[0];
  const activePos = useMemo(() => {
    if (!activeEvent || activeEvent.isRest) {
      return { stringIndex: -1, fret: 0, isRest: true };
    }
    const p = findBestStringAndFret(activeEvent.midi, tuning, activeEvent.stringNum, activeEvent.fret);
    return { ...p, isRest: false };
  }, [activeEvent, tuning]);

  const activeNoteName =
    activeEvent && !activeEvent.isRest
      ? `${midiToNoteInfo(activeEvent.midi, false).intlBase} (${midiToNoteInfo(activeEvent.midi, false).es})`
      : 'Silencio / Corte (Mute)';

  // Compute right-hand floating thumb Y anchor position
  // stringIndex: 0 = G (top), 1 = D, 2 = A, 3 = E (bottom)
  const stringYs = [42, 68, 94, 120];
  const thumbAnchorY = useMemo(() => {
    if (activePos.isRest) return 118;
    if (preset === 'floating_thumb') {
      // Thumb rests one string thicker than active string, or on pickup (142) when playing E (3)
      if (activePos.stringIndex === 3) return 142;
      if (activePos.stringIndex === 2) return stringYs[3];
      if (activePos.stringIndex === 1) return stringYs[2];
      return stringYs[1];
    }
    if (preset === 'slap_pop') {
      return activePos.stringIndex >= 0 ? stringYs[activePos.stringIndex] : 120;
    }
    if (preset === 'upright') {
      return 34; // Side of fingerboard anchor
    }
    if (preset === 'staccato_muting') {
      return 126; // Bridge/palm mute anchor
    }
    return 142; // Pickup rest
  }, [activePos, preset]);

  const activeRightActionLabel = useMemo(() => {
    if (!activeEvent) return 'Listo';
    if (activeEvent.isRest) return 'Silencio · Mano izquierda/derecha apagan cuerdas';
    if (activeEvent.technique === 'slap') return 'SLAP (T) · Rebote rápido de pulgar';
    if (activeEvent.technique === 'pop') return 'POP (P) · Tirón elástico con dedo índice';
    if (activeEvent.technique === 'ghost') return 'FANTASMA (X) · Ataque percusivo muteado';
    if (activeEvent.technique === 'staccato') return 'STACCATO (.) · Corte seco inmediato';
    if (activeEvent.technique === 'hammer') return 'HAMMER-ON (H) · Ligado con mano izquierda';
    if (activeEvent.technique === 'pull') return 'PULL-OFF (PO) · Pellizco descendente';
    if (activeEvent.technique === 'slide') return 'SLIDE (/) · Deslizamiento expresivo';
    if (preset === 'floating_thumb') {
      return activePos.stringIndex === 3
        ? 'Pulgar en pastilla · Pulsando cuerda E (4ª)'
        : `Pulgar muteando cuerda ${STRING_LABELS[Math.min(3, activePos.stringIndex + 1)]}`;
    }
    if (preset === 'staccato_muting') return 'Palm Mute / Relajación izquierda inmediata';
    if (preset === 'rocknroll') return 'Púa / Ataque firme alternado (i–m)';
    if (preset === 'reggae') return 'Pulsación profunda sobre los últimos trastes';
    if (preset === 'cumbia') return 'Ataque rítmico firme + corte limpio';
    if (preset === 'upright') return 'Pizzicato vertical con todo el lateral del dedo';
    return activeNoteIdx % 2 === 0 ? 'Mano derecha: Dedo Índice (i)' : 'Mano derecha: Dedo Medio (m)';
  }, [activeEvent, activeNoteIdx, activePos.stringIndex, preset]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Animator Header Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-bold tracking-wide uppercase text-amber-400">
              Demostración Visual Interactiva · Paso {step.stepNumber}
            </div>
            <div className="text-xs text-slate-400">{step.visualCue}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setSpeedMultiplier(0.6)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-mono font-semibold cursor-pointer ${
                speedMultiplier === 0.6
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              0.6x Lento
            </button>
            <button
              type="button"
              onClick={() => setSpeedMultiplier(1.0)}
              className={`px-2.5 py-1.5 font-mono font-semibold border-l border-slate-700 cursor-pointer ${
                speedMultiplier === 1.0
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              1.0x ({step.bpm} BPM)
            </button>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            title="Reiniciar demostración"
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pausar Demo' : 'Reproducir Demo'}
          </button>
        </div>
      </div>

      {/* Animated SVG Stage: Left Fretboard + Right Hand Technique Motion */}
      <div className="p-4 space-y-3">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 820 176"
            className="w-full min-w-[600px] h-auto select-none rounded-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800"
          >
            {/* Left Neck Background (Rosewood / Maple) */}
            <rect x={28} y={24} width={452} height={114} rx={4} fill="#2b1e16" stroke="#573d2c" strokeWidth={1.5} />

            {/* Nut */}
            <rect x={44} y={24} width={7} height={114} fill="#e2d9c8" />

            {/* Fret wires 1..9 */}
            {Array.from({ length: 9 }, (_, i) => {
              const x = 51 + (i + 1) * 47;
              return (
                <g key={i}>
                  <line x1={x} y1={24} x2={x} y2={138} stroke="#a8a29e" strokeWidth={2} />
                  <text
                    x={x - 23}
                    y={156}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono"
                    fontSize="10"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Inlay markers (3, 5, 7, 9) */}
            {[3, 5, 7, 9].map((f) => (
              <circle
                key={f}
                cx={51 + (f - 0.5) * 47}
                cy={81}
                r={4.2}
                fill="#d6d3d1"
                opacity={0.45}
              />
            ))}

            {/* Right Body & Pickup Area */}
            <rect x={480} y={16} width={320} height={144} rx={12} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
            {/* Neck Pickup */}
            <rect x={545} y={32} width={28} height={116} rx={5} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            {/* Bridge Pickup */}
            <rect x={685} y={32} width={28} height={116} rx={5} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <text x={559} y={162} textAnchor="middle" className="fill-slate-500 font-mono" fontSize="9">
              PASTILLA MÁSTIL
            </text>
            <text x={699} y={162} textAnchor="middle" className="fill-slate-500 font-mono" fontSize="9">
              PUENTE
            </text>

            {/* 4 Strings spanning full neck + body */}
            {STRING_LABELS.map((label, sIdx) => {
              const y = stringYs[sIdx];
              const isStruck = !activePos.isRest && activePos.stringIndex === sIdx && activeNoteIdx >= 0;
              const isMutedByThumb =
                preset === 'floating_thumb' &&
                !activePos.isRest &&
                activePos.stringIndex >= 0 &&
                sIdx > activePos.stringIndex;
              const gauge = 1.6 + sIdx * 0.8;

              return (
                <g key={label}>
                  <text
                    x={16}
                    y={y + 4}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono font-bold"
                    fontSize="10"
                  >
                    {label.split(' ')[0]}
                  </text>
                  <line
                    x1={28}
                    y1={y}
                    x2={785}
                    y2={y}
                    stroke={isStruck ? '#f59e0b' : isMutedByThumb ? '#38bdf8' : '#94a3b8'}
                    strokeWidth={isStruck ? gauge + 1.4 : gauge}
                    opacity={isMutedByThumb ? 0.65 : 1}
                  />
                  {isStruck && isPlaying && (
                    <line
                      x1={480}
                      y1={y - 2}
                      x2={765}
                      y2={y + 2}
                      stroke="#fbbf24"
                      strokeWidth={1}
                      opacity={0.75}
                    />
                  )}
                </g>
              );
            })}

            {/* Left-hand Fret Highlight */}
            {!activePos.isRest && activePos.stringIndex >= 0 && (
              <g>
                {(() => {
                  const fretX =
                    activePos.fret === 0 ? 36 : 51 + (Math.min(9, activePos.fret) - 0.5) * 47;
                  const fretY = stringYs[activePos.stringIndex];
                  const isGhost = activeEvent?.technique === 'ghost';
                  return (
                    <>
                      <circle
                        cx={fretX}
                        cy={fretY}
                        r={14}
                        fill={isGhost ? '#475569' : '#d97706'}
                        opacity={0.32}
                      />
                      <circle
                        cx={fretX}
                        cy={fretY}
                        r={10.5}
                        fill={isGhost ? '#64748b' : '#f59e0b'}
                        stroke="#fff"
                        strokeWidth={1.6}
                      />
                      <text
                        x={fretX}
                        y={fretY + 4}
                        textAnchor="middle"
                        className="fill-slate-950 font-mono font-extrabold"
                        fontSize="11"
                      >
                        {isGhost ? 'X' : activePos.fret}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* Right-Hand Thumb / Technique Animated Marker */}
            <g
              style={{
                transform: `translate(0px, ${thumbAnchorY}px)`,
                transition: 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* Floating Thumb / Slap / Anchor Capsule */}
              <rect
                x={preset === 'reggae' || preset === 'slap_pop' ? 488 : 542}
                y={-11}
                width={56}
                height={22}
                rx={11}
                fill={preset === 'slap_pop' ? '#e11d48' : '#0284c7'}
                stroke="#e0f2fe"
                strokeWidth={1.5}
              />
              <text
                x={preset === 'reggae' || preset === 'slap_pop' ? 516 : 570}
                y={4}
                textAnchor="middle"
                className="fill-white font-mono font-bold"
                fontSize="9.5"
              >
                {preset === 'slap_pop'
                  ? activeEvent?.technique === 'pop'
                    ? 'POP (Índ)'
                    : 'SLAP (Pul)'
                  : preset === 'floating_thumb'
                    ? 'PULGAR'
                    : preset === 'rocknroll'
                      ? 'PÚA/DEDOS'
                      : 'ANCLAJE'}
              </text>
            </g>

            {/* Pluck / Pop target indicator on the active string */}
            {!activePos.isRest && activePos.stringIndex >= 0 && (
              <g>
                <circle
                  cx={preset === 'reggae' ? 516 : 630}
                  cy={stringYs[activePos.stringIndex]}
                  r={11}
                  fill={activeEvent?.technique === 'pop' ? '#38bdf8' : '#fbbf24'}
                  opacity={isPlaying ? 0.9 : 0.45}
                />
                <text
                  x={preset === 'reggae' ? 516 : 630}
                  y={stringYs[activePos.stringIndex] + 3.5}
                  textAnchor="middle"
                  className="fill-slate-950 font-mono font-extrabold"
                  fontSize="10"
                >
                  {activeEvent?.technique === 'pop'
                    ? 'P'
                    : activeEvent?.technique === 'slap'
                      ? 'T'
                      : activeNoteIdx % 2 === 0
                        ? 'i'
                        : 'm'}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Live Sync Readout & Sequence Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono font-bold text-amber-400 tabular-nums">
              {effectiveBpm} BPM ({speedMultiplier === 0.6 ? 'Lento' : 'Original'})
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-semibold text-white">{activeNoteName}</span>
            <span className="text-slate-600">·</span>
            <span className="text-sky-300">{activeRightActionLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {step.notes.map((n, idx) => {
              const isCur = idx === activeNoteIdx;
              const label = n.isRest
                ? 'Sil'
                : n.technique === 'ghost'
                  ? 'X'
                  : midiToNoteInfo(n.midi, false).intlBase;
              return (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold transition-colors ${
                    isCur
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
