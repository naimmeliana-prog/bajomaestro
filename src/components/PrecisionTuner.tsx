import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Gauge,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { useSync } from '../context/SyncContext';
import { useTheorySelection } from '../context/TheorySelectionContext';
import {
  audioManager,
  computeRmsLevel,
  detectBassPitchYIN,
  playReferencePitch,
  TunerReading,
} from '../utils/audioEngine';
import { TUNING_PRESETS } from '../utils/musicTheory';

interface PrecisionTunerProps {
  /** Incremented by parent if another mic tool (e.g. chord detector) acquires the mic */
  forceStopSignal?: number;
  onActiveChange?: (active: boolean) => void;
  onReadingChange?: (reading: TunerReading | null) => void;
}

const A4_CALIBRATIONS = [432, 440, 442, 444];
const LED_TICKS = [-40, -30, -20, -10, -4, 0, 4, 10, 20, 30, 40];

export const PrecisionTuner: React.FC<PrecisionTunerProps> = ({
  forceStopSignal = 0,
  onActiveChange,
  onReadingChange,
}) => {
  const { updatePreferences } = useSync();
  const { tuningId, setTuningId } = useTheorySelection();

  const [tunerActive, setTunerActive] = useState(false);
  const [a4Hz, setA4Hz] = useState<number>(440);
  const [tunerReading, setTunerReading] = useState<TunerReading | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const [tunerError, setTunerError] = useState<string | null>(null);

  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const smoothedHzRef = useRef<number | null>(null);
  const a4Ref = useRef<number>(a4Hz);

  useEffect(() => {
    a4Ref.current = a4Hz;
  }, [a4Hz]);

  const activePreset = useMemo(
    () => TUNING_PRESETS.find((t) => t.id === tuningId) || TUNING_PRESETS[0],
    [tuningId]
  );

  const stopTuner = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    smoothedHzRef.current = null;
    setTunerActive(false);
    setTunerReading(null);
    setInputLevel(0);
    onActiveChange?.(false);
    onReadingChange?.(null);
  };

  useEffect(() => {
    if (forceStopSignal > 0 && tunerActive) {
      stopTuner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceStopSignal]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleTuner = async () => {
    if (tunerActive) {
      stopTuner();
      return;
    }
    setTunerError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const ctx = audioManager.getContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      setTunerActive(true);
      onActiveChange?.(true);

      const tick = () => {
        if (!streamRef.current) return;
        analyser.getFloatTimeDomainData(buffer);

        const rms = computeRmsLevel(buffer);
        setInputLevel(Math.min(100, Math.round(rms * 550)));

        const rawReading = detectBassPitchYIN(buffer, ctx.sampleRate, a4Ref.current);
        if (rawReading) {
          // Smooth jitter while resetting immediately on large pitch jumps (> 35 cents)
          const prevHz = smoothedHzRef.current;
          const jumpCents = prevHz ? Math.abs(1200 * Math.log2(rawReading.hz / prevHz)) : 999;
          const smoothHz =
            prevHz && jumpCents < 35 ? prevHz * 0.72 + rawReading.hz * 0.28 : rawReading.hz;
          smoothedHzRef.current = smoothHz;

          const midiFloat = 69 + 12 * Math.log2(smoothHz / a4Ref.current);
          const nearestMidi = Math.round(midiFloat);
          const centsFloat = (midiFloat - nearestMidi) * 100;
          const targetHz = a4Ref.current * Math.pow(2, (nearestMidi - 69) / 12);

          const smoothed: TunerReading = {
            ...rawReading,
            hz: smoothHz,
            targetHz,
            midi: nearestMidi,
            centsFloat,
            cents: Math.round(centsFloat),
          };
          setTunerReading(smoothed);
          onReadingChange?.(smoothed);
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setTunerError(
        'No se pudo acceder al micrófono. Concede permisos de audio en tu navegador para usar el afinador.'
      );
      setTunerActive(false);
      onActiveChange?.(false);
    }
  };

  const centsClamped = tunerReading
    ? Math.max(-50, Math.min(50, tunerReading.centsFloat))
    : 0;
  const isInTune = tunerReading !== null && Math.abs(tunerReading.cents) <= 4;
  const isClose = tunerReading !== null && !isInTune && Math.abs(tunerReading.cents) <= 12;
  const isFlat = tunerReading !== null && tunerReading.cents < -4;
  const isSharp = tunerReading !== null && tunerReading.cents > 4;

  // Semicircular analog gauge angle (-50 cents -> -58 deg, +50 cents -> +58 deg)
  const needleAngleDeg = tunerReading ? (centsClamped / 50) * 58 : 0;

  // Closest string in active preset
  const matchedStringMidi = useMemo(() => {
    if (!tunerReading) return null;
    let bestMidi: number | null = null;
    let bestDiff = 99;
    activePreset.strings.forEach((s) => {
      const diff = Math.abs(s.midi - tunerReading.midi);
      if (diff <= 1 && diff < bestDiff) {
        bestDiff = diff;
        bestMidi = s.midi;
      }
    });
    return bestMidi;
  }, [activePreset.strings, tunerReading]);

  return (
    <section className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header + Mic Activation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Afinador Cromático de Precisión
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Detección YIN en tiempo real para graves extremos (desde Si0 30.87 Hz)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={a4Hz}
            onChange={(e) => setA4Hz(Number(e.target.value))}
            aria-label="Calibración La4"
            className="text-xs font-mono font-semibold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200"
          >
            {A4_CALIBRATIONS.map((hz) => (
              <option key={hz} value={hz}>
                A4 = {hz} Hz
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void toggleTuner()}
            aria-pressed={tunerActive}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tunerActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {tunerActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {tunerActive ? 'Detener Afinador' : 'Activar Micrófono'}
          </button>
        </div>
      </div>

      {tunerError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{tunerError}</span>
        </div>
      )}

      {/* Real-Time Analog Needle + Digital Frequency Precision Display */}
      <div className="bg-slate-50 dark:bg-slate-950/75 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Semicircular SVG Needle Precision Meter */}
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 320 134" className="w-full max-w-[320px] h-auto select-none">
            {/* Outer Arc Track */}
            <path
              d="M 38 118 A 136 136 0 0 1 282 118"
              fill="none"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={10}
              strokeLinecap="round"
            />
            {/* Center Green In-Tune Zone Arc */}
            <path
              d="M 148 16.5 A 136 136 0 0 1 172 16.5"
              fill="none"
              className="stroke-emerald-500/75"
              strokeWidth={10}
              strokeLinecap="round"
            />

            {/* Radial Scale Ticks (-50, -25, -10, 0, +10, +25, +50) */}
            {[-50, -25, -10, 0, 10, 25, 50].map((val) => {
              const deg = (val / 50) * 58;
              const rad = ((deg - 90) * Math.PI) / 180;
              const cx = 160;
              const cy = 148;
              const r1 = val === 0 ? 116 : 122;
              const r2 = 138;
              const tx = cx + Math.cos(rad) * 104;
              const ty = cy + Math.sin(rad) * 104;
              return (
                <g key={val}>
                  <line
                    x1={cx + Math.cos(rad) * r1}
                    y1={cy + Math.sin(rad) * r1}
                    x2={cx + Math.cos(rad) * r2}
                    y2={cy + Math.sin(rad) * r2}
                    className={
                      val === 0
                        ? 'stroke-emerald-500'
                        : 'stroke-slate-400 dark:stroke-slate-600'
                    }
                    strokeWidth={val === 0 ? 2.6 : 1.5}
                  />
                  <text
                    x={tx}
                    y={ty + 3}
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400 font-mono tabular-nums"
                    fontSize="8.5"
                  >
                    {val > 0 ? `+${val}` : val}
                  </text>
                </g>
              );
            })}

            {/* Rotating Precision Needle */}
            <g
              style={{
                transform: `rotate(${needleAngleDeg}deg)`,
                transformOrigin: '160px 148px',
                transition: 'transform 85ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <line
                x1={160}
                y1={148}
                x2={160}
                y2={23}
                className={
                  isInTune
                    ? 'stroke-emerald-500'
                    : isClose
                      ? 'stroke-amber-500'
                      : tunerReading
                        ? 'stroke-rose-500'
                        : 'stroke-slate-400 dark:stroke-slate-600'
                }
                strokeWidth={3}
                strokeLinecap="round"
              />
            </g>

            {/* Needle Pivot Hub */}
            <circle
              cx={160}
              cy={124}
              r={6}
              className={
                isInTune
                  ? 'fill-emerald-500'
                  : tunerReading
                    ? 'fill-amber-500'
                    : 'fill-slate-400 dark:fill-slate-600'
              }
            />
          </svg>

          {/* LED Precision Cent Segments */}
          <div className="flex items-center justify-center gap-1.5 w-full max-w-[300px] mt-1">
            {LED_TICKS.map((tick) => {
              const isCenter = tick === 0;
              const isLit =
                tunerReading !== null &&
                (isCenter
                  ? Math.abs(tunerReading.cents) <= 4
                  : tick < 0
                    ? tunerReading.cents <= tick + 3 && tunerReading.cents < -4
                    : tunerReading.cents >= tick - 3 && tunerReading.cents > 4);
              return (
                <div
                  key={tick}
                  className={`flex-1 rounded-full transition-colors ${
                    isCenter ? 'h-3' : 'h-2'
                  } ${
                    isLit
                      ? isCenter
                        ? 'bg-emerald-500'
                        : Math.abs(tick) <= 10
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Note + Frequency + Cents Digital Readout */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-1">
          <div className="text-center min-w-[100px]">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Nota Detectada
            </div>
            <div
              className={`font-display font-extrabold text-4xl sm:text-5xl tabular-nums mt-0.5 ${
                isInTune
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {tunerReading ? tunerReading.noteIntl : '—'}
            </div>
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {tunerReading ? tunerReading.noteEs : 'Toca una cuerda al aire'}
            </div>
          </div>

          <div className="h-16 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="text-center min-w-[155px]">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Frecuencia Medida
            </div>
            <div className="font-mono font-bold text-3xl sm:text-4xl text-sky-700 dark:text-sky-400 tabular-nums mt-0.5">
              {tunerReading ? `${tunerReading.hz.toFixed(2)} Hz` : '00.00 Hz'}
            </div>
            <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {tunerReading
                ? `Objetivo: ${tunerReading.targetHz.toFixed(2)} Hz (${
                    tunerReading.cents > 0 ? `+${tunerReading.cents}` : tunerReading.cents
                  } cents)`
                : `Ref. La4 = ${a4Hz} Hz`}
            </div>
          </div>
        </div>

        {/* Status Banner + Mic Input Level VU */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="font-semibold">
            {isInTune && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> AFINADO CON PRECISIÓN (±4 cents)
              </span>
            )}
            {isFlat && (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <ArrowUp className="w-4 h-4" /> GRAVE · SUBIR TENSIÓN ({tunerReading?.cents} cents)
              </span>
            )}
            {isSharp && (
              <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <ArrowDown className="w-4 h-4" /> AGUDO · BAJAR TENSIÓN (+{tunerReading?.cents} cents)
              </span>
            )}
            {!tunerReading && (
              <span className="text-slate-500 dark:text-slate-400">
                {tunerActive ? 'Escuchando entrada de micrófono...' : 'Micrófono en espera'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="text-[10px] font-mono uppercase text-slate-500">Señal</span>
            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-75"
                style={{ width: `${tunerActive ? Math.max(4, inputLevel) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tuning Preset Selector & Reference Tone Playback */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Cuerdas de Referencia (clic para oír tono):
          </label>
          <select
            value={tuningId}
            onChange={(e) => {
              setTuningId(e.target.value);
              void updatePreferences({ preferredTuning: e.target.value });
            }}
            aria-label="Seleccionar afinación"
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          >
            {TUNING_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activePreset.strings.map((s) => {
            const calibratedHz = s.hz * (a4Hz / 440);
            const isMatched = matchedStringMidi === s.midi;
            return (
              <button
                key={s.label + s.midi}
                type="button"
                onClick={() => playReferencePitch(calibratedHz, 2.2)}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  isMatched && isInTune
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/35'
                    : isMatched
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:border-amber-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {s.label} ({s.noteEs})
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                  {calibratedHz.toFixed(2)} Hz
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
