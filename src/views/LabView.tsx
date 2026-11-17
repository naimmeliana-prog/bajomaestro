import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Mic,
  MicOff,
  RotateCcw,
} from 'lucide-react';
import { AdvancedMetronome } from '../components/AdvancedMetronome';
import { LabFretboard } from '../components/LabFretboard';
import { PrecisionTuner } from '../components/PrecisionTuner';
import {
  analyzeHarmonicSpectrum,
  audioManager,
  HarmonicAnalysisResult,
  TunerReading,
} from '../utils/audioEngine';
import { NOTE_NAMES_ES_SHARP, NOTE_NAMES_SHARP } from '../utils/musicTheory';

interface LabViewProps {
  onOpenLibrary?: () => void;
}

export const LabView: React.FC<LabViewProps> = ({ onOpenLibrary }) => {
  // ---------------- TUNER COORDINATION STATE ----------------
  const [tunerReading, setTunerReading] = useState<TunerReading | null>(null);
  const [stopTunerSignal, setStopTunerSignal] = useState(0);

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

  // Cleanup mic stream on unmount
  useEffect(() => {
    return () => {
      if (detectorRafRef.current) cancelAnimationFrame(detectorRafRef.current);
      detectorStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopDetector = () => {
    if (detectorRafRef.current) {
      cancelAnimationFrame(detectorRafRef.current);
      detectorRafRef.current = null;
    }
    detectorStreamRef.current?.getTracks().forEach((t) => t.stop());
    detectorStreamRef.current = null;
    setDetectorActive(false);
  };

  const startDetector = async () => {
    if (detectorActive) {
      stopDetector();
      return;
    }
    setStopTunerSignal((s) => s + 1);
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
        <PrecisionTuner
          forceStopSignal={stopTunerSignal}
          onActiveChange={(active) => {
            if (active) stopDetector();
          }}
          onReadingChange={setTunerReading}
        />

        {/* 2. ADVANCED METRONOME */}
        <AdvancedMetronome />
      </div>

      {/* Middle Row: Interactive Library-Synced Fretboard */}
      <LabFretboard
        liveMicPitchClass={tunerReading ? ((tunerReading.midi % 12) + 12) % 12 : null}
        liveMicNoteLabel={tunerReading ? `${tunerReading.noteIntl} (${tunerReading.noteEs})` : null}
        detectedChordSymbol={
          detectorActive && harmonicResult.detectedChord !== '—'
            ? harmonicResult.detectedChord
            : null
        }
        onOpenLibrary={onOpenLibrary}
      />

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
