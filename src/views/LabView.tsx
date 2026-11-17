import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Gauge,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { useSync } from '../context/SyncContext';
import { TimeSignature } from '../types/music';
import {
  analyzeHarmonicSpectrum,
  audioManager,
  detectBassPitchYIN,
  HarmonicAnalysisResult,
  MetronomeEngine,
  MetronomeSubdivision,
  playReferencePitch,
  TunerReading,
} from '../utils/audioEngine';
import { NOTE_NAMES_ES_SHARP, NOTE_NAMES_SHARP, TUNING_PRESETS } from '../utils/musicTheory';

const METER_OPTIONS: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8', '12/8', '5/4', '7/8'];

export const LabView: React.FC = () => {
  const { preferences, updatePreferences } = useSync();

  // ---------------- TUNER STATE ----------------
  const [tuningId, setTuningId] = useState(preferences.preferredTuning || '4-standard');
  const [tunerActive, setTunerActive] = useState(false);
  const [tunerReading, setTunerReading] = useState<TunerReading | null>(null);
  const [tunerError, setTunerError] = useState<string | null>(null);

  const tunerRafRef = useRef<number | null>(null);
  const tunerStreamRef = useRef<MediaStream | null>(null);

  // ---------------- CHORD & KEY DETECTOR STATE ----------------
  const [detectorActive, setDetectorActive] = useState(false);
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [harmonicResult, setHarmonicResult] = useState<HarmonicAnalysisResult>({
    chromagram: new Array(12).fill(0),
    detectedChord: '—',
    detectedChordEs: 'Activa el micrófono para analizar',
    chordConfidence: 0,
    detectedKey: '—',
    keyConfidence: 0,
    activeBassNote: '—',
  });
  const [chordHistory, setChordHistory] = useState<string[]>([]);

  const detectorRafRef = useRef<number | null>(null);
  const detectorStreamRef = useRef<MediaStream | null>(null);
  const keyChromaRef = useRef<number[]>(new Array(12).fill(0));
  const lastChordRef = useRef<string>('');
  const lastChordTimeRef = useRef<number>(0);

  // ---------------- METRONOME STATE ----------------
  const [metroRunning, setMetroRunning] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivision] = useState<MetronomeSubdivision>('quarter');
  const [swingPercent, setSwingPercent] = useState(0);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [totalBeats, setTotalBeats] = useState(4);

  const metroRef = useRef<MetronomeEngine | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  const activePreset = TUNING_PRESETS.find((t) => t.id === tuningId) || TUNING_PRESETS[0];

  // Init & cleanup metronome
  useEffect(() => {
    const engine = new MetronomeEngine();
    metroRef.current = engine;
    return () => {
      engine.stop();
    };
  }, []);

  useEffect(() => {
    metroRef.current?.configure({
      bpm,
      timeSignature,
      subdivision,
      swingPercent,
      onBeat: (beatIdx, beatsCount) => {
        setActiveBeat(beatIdx);
        setTotalBeats(beatsCount);
      },
    });
    const [num] = timeSignature.split('/').map(Number);
    setTotalBeats(num || 4);
  }, [bpm, timeSignature, subdivision, swingPercent]);

  // Cleanup mic streams on unmount
  useEffect(() => {
    return () => {
      if (tunerRafRef.current) cancelAnimationFrame(tunerRafRef.current);
      tunerStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (detectorRafRef.current) cancelAnimationFrame(detectorRafRef.current);
      detectorStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopTuner = () => {
    if (tunerRafRef.current) {
      cancelAnimationFrame(tunerRafRef.current);
      tunerRafRef.current = null;
    }
    tunerStreamRef.current?.getTracks().forEach((t) => t.stop());
    tunerStreamRef.current = null;
    setTunerActive(false);
    setTunerReading(null);
  };

  const stopDetector = () => {
    if (detectorRafRef.current) {
      cancelAnimationFrame(detectorRafRef.current);
      detectorRafRef.current = null;
    }
    detectorStreamRef.current?.getTracks().forEach((t) => t.stop());
    detectorStreamRef.current = null;
    setDetectorActive(false);
  };

  const startTuner = async () => {
    if (tunerActive) {
      stopTuner();
      return;
    }
    stopDetector();
    setTunerError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      tunerStreamRef.current = stream;
      const ctx = audioManager.getContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      setTunerActive(true);

      const tick = () => {
        if (!tunerStreamRef.current) return;
        analyser.getFloatTimeDomainData(buffer);
        const reading = detectBassPitchYIN(buffer, ctx.sampleRate);
        if (reading) {
          setTunerReading(reading);
        }
        tunerRafRef.current = requestAnimationFrame(tick);
      };
      tunerRafRef.current = requestAnimationFrame(tick);
    } catch {
      setTunerError(
        'No se pudo acceder al micrófono. Concede permisos de audio en tu navegador para usar el afinador.'
      );
      setTunerActive(false);
    }
  };

  const startDetector = async () => {
    if (detectorActive) {
      stopDetector();
      return;
    }
    stopTuner();
    setDetectorError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      detectorStreamRef.current = stream;
      const ctx = audioManager.getContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 16384;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      setDetectorActive(true);

      const tick = () => {
        if (!detectorStreamRef.current) return;
        analyser.getByteFrequencyData(freqData);
        const res = analyzeHarmonicSpectrum(
          freqData,
          ctx.sampleRate,
          analyser.fftSize,
          keyChromaRef.current
        );
        setHarmonicResult(res);

        const now = Date.now();
        if (
          res.detectedChord !== '—' &&
          res.chordConfidence >= 45 &&
          res.detectedChord !== lastChordRef.current &&
          now - lastChordTimeRef.current > 700
        ) {
          lastChordRef.current = res.detectedChord;
          lastChordTimeRef.current = now;
          setChordHistory((prev) => [res.detectedChord, ...prev].slice(0, 12));
        }

        detectorRafRef.current = requestAnimationFrame(tick);
      };
      detectorRafRef.current = requestAnimationFrame(tick);
    } catch {
      setDetectorError(
        'No se pudo acceder al micrófono. Autoriza el permiso de audio para detectar tonalidades y acordes.'
      );
      setDetectorActive(false);
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const recent = tapTimesRef.current.filter((t) => now - t < 2500);
    recent.push(now);
    tapTimesRef.current = recent;
    if (recent.length >= 2) {
      const diffs = [];
      for (let i = 1; i < recent.length; i++) {
        diffs.push(recent[i] - recent[i - 1]);
      }
      const avgMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const nextBpm = Math.max(30, Math.min(260, Math.round(60000 / avgMs)));
      setBpm(nextBpm);
    }
  };

  // Tuner status helpers (dual-coded)
  const isInTune = tunerReading !== null && Math.abs(tunerReading.cents) <= 5;
  const isFlat = tunerReading !== null && tunerReading.cents < -5;
  const isSharp = tunerReading !== null && tunerReading.cents > 5;
  const needlePercent = tunerReading
    ? Math.max(2, Math.min(98, 50 + tunerReading.cents))
    : 50;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Laboratorio Auditivo, Afinador y Metrónomo
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Herramientas DSP en tiempo real con micrófono y síntesis Web Audio de precisión
        </p>
      </div>

      {/* Top Row: Precision Tuner + Integrated Metronome */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* 1. PRECISION BASS TUNER */}
        <section className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Afinador Cromático de Precisión
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rango extendido para graves (desde Si0 30.87 Hz hasta Agudos)
              </p>
            </div>

            <button
              type="button"
              onClick={() => void startTuner()}
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

          {tunerError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{tunerError}</span>
            </div>
          )}

          {/* Frequency & Note Readout */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Nota Detectada
                </div>
                <div className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                  {tunerReading ? tunerReading.noteIntl : '—'}
                </div>
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                  {tunerReading ? tunerReading.noteEs : 'Toca una cuerda al aire'}
                </div>
              </div>

              <div className="h-16 w-px bg-slate-200 dark:bg-slate-800" />

              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Frecuencia Exacta
                </div>
                <div className="font-mono font-bold text-3xl sm:text-4xl text-sky-700 dark:text-sky-400 tabular-nums mt-1">
                  {tunerReading ? `${tunerReading.hz.toFixed(2)} Hz` : '00.00 Hz'}
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                  Desviación: {tunerReading ? `${tunerReading.cents > 0 ? '+' : ''}${tunerReading.cents} cents` : '0 cents'}
                </div>
              </div>
            </div>

            {/* Cents Meter */}
            <div className="space-y-2">
              <div className="relative h-4 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                {/* Center In-Tune Zone */}
                <div className="absolute left-[45%] width-[10%] w-[10%] top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-500/50" />
                {/* Needle Marker */}
                <div
                  className={`absolute top-0.5 bottom-0.5 w-2.5 -ml-1.5 rounded-full transition-all duration-75 ${
                    isInTune
                      ? 'bg-emerald-500'
                      : tunerReading
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                  style={{ left: `${needlePercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span>-50 cents (Grave)</span>
                <span className="font-semibold">
                  {isInTune && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> AFINADO
                    </span>
                  )}
                  {isFlat && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <ArrowUp className="w-3.5 h-3.5" /> SUBIR TENSIÓN (GRAVE)
                    </span>
                  )}
                  {isSharp && (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                      <ArrowDown className="w-3.5 h-3.5" /> BAJAR TENSIÓN (AGUDO)
                    </span>
                  )}
                  {!tunerReading && (tunerActive ? 'ESCUCHANDO...' : 'EN ESPERA')}
                </span>
                <span>+50 cents (Agudo)</span>
              </div>
            </div>
          </div>

          {/* Preset Tuning Selector & Reference Pitch Playback */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Afinación de Referencia (clic en cuerda para oír tono):
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
              {activePreset.strings.map((s) => (
                <button
                  key={s.label + s.midi}
                  type="button"
                  onClick={() => playReferencePitch(s.hz, 2.2)}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:border-amber-500 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {s.label} ({s.noteEs})
                    </span>
                    <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                    {s.hz.toFixed(2)} Hz
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. INTEGRATED LOOKAHEAD METRONOME */}
        <section className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Metrónomo de Estudio (Lookahead)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subdivisiones, swing ajustable, compases irregulares y Tap Tempo
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (metroRunning) {
                  metroRef.current?.stop();
                  setMetroRunning(false);
                  setActiveBeat(-1);
                } else {
                  metroRef.current?.start();
                  setMetroRunning(true);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                metroRunning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {metroRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {metroRunning ? 'Detener' : 'Iniciar Pulso'}
            </button>
          </div>

          {/* Visual Beat Strip */}
          <div className="flex items-center justify-center gap-2.5 py-2">
            {Array.from({ length: totalBeats }, (_, i) => {
              const isCurrent = metroRunning && activeBeat === i;
              const isOne = i === 0;
              return (
                <div
                  key={i}
                  className={`flex-1 max-w-14 h-12 rounded-xl border flex flex-col items-center justify-center font-mono font-bold transition-all ${
                    isCurrent
                      ? isOne
                        ? 'bg-amber-600 border-amber-500 text-white scale-105'
                        : 'bg-sky-600 border-sky-500 text-white scale-105'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="text-sm tabular-nums">{i + 1}</span>
                  <span className="text-[9px] uppercase">{isOne ? 'Acento' : 'Pulso'}</span>
                </div>
              );
            })}
          </div>

          {/* BPM Control + Tap Tempo */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Tempo Actual</div>
                <div className="font-mono font-extrabold text-4xl text-slate-900 dark:text-slate-100 tabular-nums">
                  {bpm} <span className="text-base font-medium text-slate-500">BPM</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBpm((v) => Math.max(30, v - 5))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold cursor-pointer"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((v) => Math.max(30, v - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold cursor-pointer"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((v) => Math.min(260, v + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold cursor-pointer"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((v) => Math.min(260, v + 5))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold cursor-pointer"
                >
                  +5
                </button>
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

          {/* Meter, Subdivision & Swing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Subdivisión
              </label>
              <select
                value={subdivision}
                onChange={(e) => setSubdivision(e.target.value as MetronomeSubdivision)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              >
                <option value="quarter">Negras (1x)</option>
                <option value="eighth">Corcheas (2x)</option>
                <option value="triplet">Tresillos (3x)</option>
                <option value="sixteenth">Semicorcheas (4x)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Swing / Shuffle</span>
                <span className="font-mono tabular-nums">{swingPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={65}
                value={swingPercent}
                disabled={subdivision !== 'eighth'}
                onChange={(e) => setSwingPercent(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Row: Microphone Real-Time Key & Chord Detector */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
              Detector de Tonalidad y Acordes por Micrófono (Educación Auditiva)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acerca tu micrófono a una canción o instrumento para analizar en vivo su cromagrama armónico, acorde activo y tonalidad global
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                keyChromaRef.current = new Array(12).fill(0);
                setChordHistory([]);
                lastChordRef.current = '';
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar análisis
            </button>

            <button
              type="button"
              onClick={() => void startDetector()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                detectorActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {detectorActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {detectorActive ? 'Detener Escucha' : 'Escuchar Canción con Micrófono'}
            </button>
          </div>
        </div>

        {detectorError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{detectorError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Chord & Key Readout Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Acorde Detectado</span>
                <span className="font-mono tabular-nums">
                  Confianza: {harmonicResult.chordConfidence}%
                </span>
              </div>
              <div className="font-display font-extrabold text-3xl text-amber-600 dark:text-amber-400 mt-1">
                {harmonicResult.detectedChord}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {harmonicResult.detectedChordEs} · Fundamental en grave: {harmonicResult.activeBassNote}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Tonalidad Estimada de la Canción</span>
                <span className="font-mono tabular-nums">
                  {harmonicResult.keyConfidence}%
                </span>
              </div>
              <div className="font-display font-bold text-xl text-sky-700 dark:text-sky-400 mt-1">
                {harmonicResult.detectedKey}
              </div>
            </div>
          </div>

          {/* 12-Bin Live Chromagram Visualizer */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Espectro Armónico por Nota (Cromagrama en Tiempo Real)
            </div>
            <div className="h-44 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-end justify-between gap-2">
              {harmonicResult.chromagram.map((val, pc) => (
                <div key={pc} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-100 ${
                        val > 0.72
                          ? 'bg-amber-500'
                          : val > 0.4
                            ? 'bg-sky-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ height: `${Math.max(6, Math.round(val * 100))}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {NOTE_NAMES_SHARP[pc]}
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    {NOTE_NAMES_ES_SHARP[pc]}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-800 dark:text-slate-200">Progresión reciente:</strong>{' '}
              {chordHistory.length > 0
                ? chordHistory.join('  →  ')
                : 'Aún no se han registrado cambios de acorde.'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
