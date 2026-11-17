import React, { useEffect, useRef, useState } from 'react';
import { Activity, Minus, Plus, Power, Volume2, VolumeX } from 'lucide-react';
import { TimeSignature } from '../types/music';
import {
  BeatAccentLevel,
  MetronomeEngine,
  MetronomeSubdivision,
} from '../utils/audioEngine';

const METER_OPTIONS: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8', '12/8', '5/4', '7/8'];

const SUBDIVISION_OPTIONS: { id: MetronomeSubdivision; label: string; hint: string }[] = [
  { id: 'quarter', label: 'Negras', hint: '1x' },
  { id: 'eighth', label: 'Corcheas', hint: '2x' },
  { id: 'triplet', label: 'Tresillos', hint: '3x' },
  { id: 'sixteenth', label: 'Semicorcheas', hint: '4x' },
  { id: 'gallop', label: 'Galope', hint: '1 + 2 semi' },
];

function buildDefaultAccents(beats: number): BeatAccentLevel[] {
  return Array.from({ length: beats }, (_, i) => (i === 0 ? 'accent' : 'normal'));
}

export const AdvancedMetronome: React.FC = () => {
  const [metroRunning, setMetroRunning] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivision] = useState<MetronomeSubdivision>('quarter');
  const [swingPercent, setSwingPercent] = useState(0);

  // Volume state (0..100) + mute toggle
  const [volumePercent, setVolumePercent] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  // Per-beat accentuation state
  const [beatAccents, setBeatAccents] = useState<BeatAccentLevel[]>(() =>
    buildDefaultAccents(4)
  );

  // Visual CSS pulse animation state
  const [activeBeat, setActiveBeat] = useState(-1);
  const [activeAccent, setActiveAccent] = useState<BeatAccentLevel>('normal');
  const [isSubClick, setIsSubClick] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);

  const metroRef = useRef<MetronomeEngine | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const engine = new MetronomeEngine();
    metroRef.current = engine;
    return () => {
      engine.stop();
    };
  }, []);

  // Adjust beatAccents length whenever timeSignature changes
  useEffect(() => {
    const [num] = timeSignature.split('/').map(Number);
    const beatsCount = num || 4;
    setBeatAccents((prev) => {
      if (prev.length === beatsCount) return prev;
      return buildDefaultAccents(beatsCount);
    });
  }, [timeSignature]);

  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volumePercent / 100;
    metroRef.current?.configure({
      bpm,
      timeSignature,
      subdivision,
      swingPercent,
      volume: effectiveVolume,
      beatAccents,
      onBeat: (beatIdx, _beatsCount, accentLevel, isSub) => {
        setActiveBeat(beatIdx);
        setActiveAccent(accentLevel);
        setIsSubClick(isSub);
        if (!isSub) {
          setPulseTick((t) => t + 1);
        }
      },
    });
  }, [bpm, timeSignature, subdivision, swingPercent, volumePercent, isMuted, beatAccents]);

  const toggleMetronome = () => {
    if (metroRunning) {
      metroRef.current?.stop();
      setMetroRunning(false);
      setActiveBeat(-1);
    } else {
      metroRef.current?.start();
      setMetroRunning(true);
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const recent = tapTimesRef.current.filter((t) => now - t < 2500);
    recent.push(now);
    tapTimesRef.current = recent;
    if (recent.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        diffs.push(recent[i] - recent[i - 1]);
      }
      const avgMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const nextBpm = Math.max(30, Math.min(260, Math.round(60000 / avgMs)));
      setBpm(nextBpm);
    }
  };

  const cycleBeatAccent = (index: number) => {
    setBeatAccents((prev) =>
      prev.map((level, i) => {
        if (i !== index) return level;
        if (level === 'accent') return 'normal';
        if (level === 'normal') return 'mute';
        return 'accent';
      })
    );
  };

  const applyAccentPreset = (preset: 'one' | 'backbeat' | 'onedrop' | 'flat') => {
    const len = beatAccents.length;
    setBeatAccents(
      Array.from({ length: len }, (_, i) => {
        if (preset === 'one') return i === 0 ? 'accent' : 'normal';
        if (preset === 'backbeat') return i === 1 || i === 3 ? 'accent' : 'normal';
        if (preset === 'onedrop') return i === 2 ? 'accent' : i === 0 ? 'mute' : 'normal';
        return 'normal';
      })
    );
  };

  const adjustVolume = (delta: number) => {
    setIsMuted(false);
    setVolumePercent((v) => Math.max(0, Math.min(100, v + delta)));
  };

  const isAccentPulse = metroRunning && !isSubClick && activeAccent === 'accent';
  const isNormalPulse = metroRunning && !isSubClick && activeAccent === 'normal';

  return (
    <section className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header + Power Toggle Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Metrónomo Avanzado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Subdivisiones rítmicas, acentuación por tiempo, volumen y pulso visual CSS
          </p>
        </div>

        <button
          type="button"
          onClick={toggleMetronome}
          aria-pressed={metroRunning}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            metroRunning
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          {metroRunning ? 'Desactivar Metrónomo' : 'Activar Metrónomo'}
        </button>
      </div>

      {/* Central Visual Pulse Orb + Interactive Beat Accent Strip */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* CSS Animated Pulse Visualizer */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              {metroRunning && pulseTick > 0 && activeAccent !== 'mute' && (
                <span
                  key={`ring-${pulseTick}`}
                  className={`animate-metro-ring absolute inset-0 rounded-full border-2 ${
                    isAccentPulse ? 'border-amber-500' : 'border-sky-500'
                  }`}
                />
              )}
              <div
                key={`orb-${pulseTick}`}
                className={`${
                  metroRunning && pulseTick > 0 && activeAccent !== 'mute' ? 'animate-metro-pop' : ''
                } w-12 h-12 rounded-full flex items-center justify-center font-mono font-extrabold text-lg tabular-nums border-2 transition-colors ${
                  !metroRunning
                    ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    : isAccentPulse
                      ? 'bg-amber-500 border-amber-400 text-white'
                      : isNormalPulse
                        ? 'bg-sky-600 border-sky-400 text-white'
                        : 'bg-slate-300 dark:bg-slate-800 border-slate-400 dark:border-slate-700 text-slate-500'
                }`}
              >
                {metroRunning && activeBeat >= 0 ? activeBeat + 1 : '—'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estado del Pulso
              </div>
              <div className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                {!metroRunning
                  ? 'En pausa'
                  : activeAccent === 'accent'
                    ? `Tiempo ${activeBeat + 1} · Acentuado`
                    : activeAccent === 'mute'
                      ? `Tiempo ${activeBeat + 1} · Silenciado`
                      : `Tiempo ${activeBeat + 1} · Pulso normal`}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Haz clic en cada cuadro para cambiar su acento
              </div>
            </div>
          </div>

          {/* Volume Controls (Up / Down / Slider / Mute) */}
          <div className="w-full sm:w-auto sm:min-w-[215px] p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? 'Activar sonido del metrónomo' : 'Silenciar metrónomo'}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 cursor-pointer"
              >
                {isMuted || volumePercent === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <span>Volumen</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustVolume(-10)}
                  aria-label="Bajar volumen del metrónomo"
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono font-bold text-xs w-9 text-center tabular-nums">
                  {isMuted ? '0%' : `${volumePercent}%`}
                </span>
                <button
                  type="button"
                  onClick={() => adjustVolume(10)}
                  aria-label="Subir volumen del metrónomo"
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volumePercent}
              onChange={(e) => {
                setIsMuted(false);
                setVolumePercent(Number(e.target.value));
              }}
              aria-label="Volumen del metrónomo"
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Configurable Beat Accents Strip */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Acentuación de Compás ({timeSignature})
            </span>
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => applyAccentPreset('one')}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 cursor-pointer"
              >
                Acento en 1
              </button>
              <button
                type="button"
                onClick={() => applyAccentPreset('backbeat')}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 cursor-pointer"
              >
                Backbeat 2 y 4
              </button>
              <button
                type="button"
                onClick={() => applyAccentPreset('onedrop')}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 cursor-pointer"
              >
                One Drop (3)
              </button>
              <button
                type="button"
                onClick={() => applyAccentPreset('flat')}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 cursor-pointer"
              >
                Todos iguales
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {beatAccents.map((level, i) => {
              const isCurrent = metroRunning && activeBeat === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => cycleBeatAccent(i)}
                  className={`flex-1 h-14 rounded-xl border flex flex-col items-center justify-center font-mono transition-all cursor-pointer ${
                    isCurrent && level === 'accent'
                      ? 'bg-amber-600 border-amber-500 text-white scale-105'
                      : isCurrent && level === 'normal'
                        ? 'bg-sky-600 border-sky-500 text-white scale-105'
                        : isCurrent && level === 'mute'
                          ? 'bg-slate-400 dark:bg-slate-700 border-slate-400 text-white scale-105'
                          : level === 'accent'
                            ? 'bg-amber-500/12 border-amber-500/60 text-amber-700 dark:text-amber-300'
                            : level === 'mute'
                              ? 'bg-slate-100 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold tabular-nums">{i + 1}</span>
                  <span className="text-[9px] uppercase font-sans font-semibold">
                    {level === 'accent' ? 'Fuerte' : level === 'mute' ? 'Mudo' : 'Normal'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tempo & Tap Tempo Control */}
      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tempo Actual</div>
            <div className="font-mono font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 tabular-nums">
              {bpm} <span className="text-sm font-medium text-slate-500">BPM</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[-5, -1, 1, 5].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => setBpm((v) => Math.max(30, Math.min(260, v + delta)))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold hover:border-amber-500 cursor-pointer tabular-nums"
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            ))}
            <button
              type="button"
              onClick={handleTapTempo}
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer ml-1"
            >
              TAP TEMPO
            </button>
          </div>
        </div>

        <input
          type="range"
          min={30}
          max={260}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          aria-label="Control deslizante de BPM"
          className="w-full accent-amber-600 cursor-pointer"
        />
      </div>

      {/* Subdivisions + Time Signature + Swing */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Subdivisión Rítmica
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {SUBDIVISION_OPTIONS.map((sub) => {
              const active = subdivision === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubdivision(sub.id)}
                  className={`px-2.5 py-2 rounded-lg border text-center transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                  }`}
                >
                  <div className="text-xs font-bold">{sub.label}</div>
                  <div className="text-[10px] font-mono opacity-80">{sub.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Compás
            </label>
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value as TimeSignature)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            >
              {METER_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Swing / Shuffle (en corcheas)</span>
              <span className="font-mono tabular-nums">{swingPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={65}
              value={swingPercent}
              disabled={subdivision !== 'eighth'}
              onChange={(e) => setSwingPercent(Number(e.target.value))}
              aria-label="Porcentaje de Swing"
              className="w-full accent-amber-600 cursor-pointer disabled:opacity-40 mt-2"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
