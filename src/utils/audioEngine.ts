import { NoteEvent, NoteTechniqueTag, TimeSignature } from '../types/music';
import {
  frequencyToMidiFloat,
  midiToFrequency,
  midiToNoteInfo,
  NOTE_NAMES_ES_SHARP,
  NOTE_NAMES_SHARP,
} from './musicTheory';

export type BassToneMode = 'electric_finger' | 'electric_pick' | 'electric_slap' | 'acoustic_upright';
export type MetronomeSubdivision = 'quarter' | 'eighth' | 'triplet' | 'sixteenth';

class AudioContextManager {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }
}

export const audioManager = new AudioContextManager();

/**
 * Synthesizes a realistic electric or acoustic bass note via Web Audio API.
 */
export function playBassNote(
  midi: number,
  durationSec = 0.5,
  mode: BassToneMode = 'electric_finger',
  technique: NoteTechniqueTag = 'normal',
  whenOffsetSec = 0
): void {
  const ctx = audioManager.getContext();
  const startTime = ctx.currentTime + whenOffsetSec;
  const freq = midiToFrequency(midi);

  const masterGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';

  // Fundamental oscillator (warm sub body)
  const oscSub = ctx.createOscillator();
  oscSub.type = 'triangle';
  oscSub.frequency.setValueAtTime(freq, startTime);

  // Harmonic oscillator (string bite & overtones)
  const oscHarm = ctx.createOscillator();
  oscHarm.type = mode === 'acoustic_upright' ? 'triangle' : 'sawtooth';
  oscHarm.frequency.setValueAtTime(freq, startTime);

  const subGain = ctx.createGain();
  const harmGain = ctx.createGain();

  // Tone shaping by instrument & technique
  if (technique === 'ghost') {
    subGain.gain.setValueAtTime(0.18, startTime);
    harmGain.gain.setValueAtTime(0.12, startTime);
    filter.frequency.setValueAtTime(520, startTime);
    filter.frequency.exponentialRampToValueAtTime(180, startTime + 0.08);
    masterGain.gain.setValueAtTime(0.001, startTime);
    masterGain.gain.linearRampToValueAtTime(0.28, startTime + 0.006);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);
  } else if (technique === 'harmonic') {
    oscSub.type = 'sine';
    oscHarm.type = 'sine';
    oscSub.frequency.setValueAtTime(freq * 2, startTime);
    oscHarm.frequency.setValueAtTime(freq * 4, startTime);
    subGain.gain.setValueAtTime(0.45, startTime);
    harmGain.gain.setValueAtTime(0.15, startTime);
    filter.frequency.setValueAtTime(3200, startTime);
    masterGain.gain.setValueAtTime(0.001, startTime);
    masterGain.gain.linearRampToValueAtTime(0.55, startTime + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(0.6, durationSec * 1.4));
  } else if (mode === 'acoustic_upright') {
    subGain.gain.setValueAtTime(0.75, startTime);
    harmGain.gain.setValueAtTime(0.25, startTime);
    filter.frequency.setValueAtTime(950, startTime);
    filter.frequency.exponentialRampToValueAtTime(220, startTime + Math.min(0.35, durationSec));
    masterGain.gain.setValueAtTime(0.001, startTime);
    masterGain.gain.linearRampToValueAtTime(0.68, startTime + 0.018);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(0.25, durationSec * 0.95));
  } else if (mode === 'electric_slap' || technique === 'slap' || technique === 'pop') {
    subGain.gain.setValueAtTime(0.6, startTime);
    harmGain.gain.setValueAtTime(0.52, startTime);
    filter.Q.setValueAtTime(3.2, startTime);
    filter.frequency.setValueAtTime(technique === 'pop' ? 3200 : 2500, startTime);
    filter.frequency.exponentialRampToValueAtTime(360, startTime + 0.22);
    masterGain.gain.setValueAtTime(0.001, startTime);
    masterGain.gain.linearRampToValueAtTime(0.7, startTime + 0.004);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(0.18, durationSec * 0.85));
  } else if (mode === 'electric_pick') {
    subGain.gain.setValueAtTime(0.58, startTime);
    harmGain.gain.setValueAtTime(0.45, startTime);
    filter.Q.setValueAtTime(1.8, startTime);
    filter.frequency.setValueAtTime(2100, startTime);
    filter.frequency.exponentialRampToValueAtTime(420, startTime + 0.25);
    masterGain.gain.setValueAtTime(0.001, startTime);
    masterGain.gain.linearRampToValueAtTime(0.62, startTime + 0.005);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(0.16, durationSec * 0.92));
  } else {
    // electric_finger
    subGain.gain.setValueAtTime(0.68, startTime);
    harmGain.gain.setValueAtTime(0.32, startTime);
    filter.Q.setValueAtTime(1.3, startTime);
    filter.frequency.setValueAtTime(technique === 'accent' ? 1750 : 1250, startTime);
    filter.frequency.exponentialRampToValueAtTime(280, startTime + Math.min(0.4, durationSec));
    const endDuration = technique === 'staccato' ? Math.min(0.15, durationSec * 0.5) : Math.max(0.18, durationSec * 0.95);
    masterGain.gain.setValueAtTime(0.001, startTime);
    masterGain.gain.linearRampToValueAtTime(technique === 'accent' ? 0.72 : 0.58, startTime + 0.009);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + endDuration);
  }

  oscSub.connect(subGain);
  oscHarm.connect(harmGain);
  subGain.connect(filter);
  harmGain.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  const stopTime = startTime + Math.max(0.22, durationSec * 1.1) + 0.05;
  oscSub.start(startTime);
  oscHarm.start(startTime);
  oscSub.stop(stopTime);
  oscHarm.stop(stopTime);
}

/**
 * Plays a steady reference tone for ear tuning.
 */
export function playReferencePitch(hz: number, durationSec = 2.0): void {
  const ctx = audioManager.getContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(hz, now);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(hz * 2, now);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.2, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.max(450, hz * 5), now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.45, now + 0.03);
  gain.gain.setValueAtTime(0.42, now + durationSec - 0.18);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  osc.connect(filter);
  osc2.connect(g2);
  g2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + durationSec + 0.02);
  osc2.stop(now + durationSec + 0.02);
}

/**
 * Sequencer for interactive exercises, sight-reading drills, and repertoire grooves.
 */
export class BassSequencePlayer {
  private timerIds: number[] = [];
  private isPlaying = false;

  public stop(): void {
    this.isPlaying = false;
    this.timerIds.forEach((id) => window.clearTimeout(id));
    this.timerIds = [];
  }

  public play(
    notes: NoteEvent[],
    bpm: number,
    mode: BassToneMode,
    options: {
      loop?: boolean;
      clickTrack?: boolean;
      onStep?: (index: number) => void;
      onFinish?: () => void;
    } = {}
  ): void {
    this.stop();
    if (!notes.length) return;
    this.isPlaying = true;

    const secPerBeat = 60 / Math.max(30, Math.min(260, bpm));

    const schedulePass = () => {
      if (!this.isPlaying) return;
      let offsetBeats = 0;

      notes.forEach((ev, idx) => {
        const delayMs = offsetBeats * secPerBeat * 1000;
        const noteSec = ev.durationBeats * secPerBeat;

        const id = window.setTimeout(() => {
          if (!this.isPlaying) return;
          options.onStep?.(idx);
          if (!ev.isRest) {
            playBassNote(ev.midi, noteSec, mode, ev.technique ?? 'normal', 0);
          }
        }, delayMs);

        this.timerIds.push(id);
        offsetBeats += ev.durationBeats;
      });

      // Schedule optional soft click on each integer beat
      if (options.clickTrack) {
        const totalBeats = Math.ceil(offsetBeats);
        for (let b = 0; b < totalBeats; b++) {
          const id = window.setTimeout(() => {
            if (!this.isPlaying) return;
            triggerMetronomeClick(b % 4 === 0 ? 'accent' : 'beat');
          }, b * secPerBeat * 1000);
          this.timerIds.push(id);
        }
      }

      const endMs = offsetBeats * secPerBeat * 1000;
      const endId = window.setTimeout(() => {
        if (!this.isPlaying) return;
        if (options.loop) {
          schedulePass();
        } else {
          this.isPlaying = false;
          options.onStep?.(-1);
          options.onFinish?.();
        }
      }, endMs + 20);
      this.timerIds.push(endId);
    };

    schedulePass();
  }
}

export function triggerMetronomeClick(
  kind: 'accent' | 'beat' | 'subdivision',
  whenTime?: number
): void {
  const ctx = audioManager.getContext();
  const time = whenTime ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = kind === 'subdivision' ? 'triangle' : 'sine';
  const freq = kind === 'accent' ? 1320 : kind === 'beat' ? 880 : 620;
  const peak = kind === 'accent' ? 0.55 : kind === 'beat' ? 0.32 : 0.16;

  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.055);
}

/**
 * Precision Web Audio Lookahead Metronome Engine.
 */
export class MetronomeEngine {
  private running = false;
  private timerId: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;

  private bpm = 100;
  private timeSignature: TimeSignature = '4/4';
  private subdivision: MetronomeSubdivision = 'quarter';
  private swingPercent = 0;
  private onBeatCallback?: (beatIndex: number, totalBeats: number, isAccent: boolean) => void;

  public configure(params: {
    bpm?: number;
    timeSignature?: TimeSignature;
    subdivision?: MetronomeSubdivision;
    swingPercent?: number;
    onBeat?: (beatIndex: number, totalBeats: number, isAccent: boolean) => void;
  }) {
    if (params.bpm !== undefined) this.bpm = Math.max(30, Math.min(260, params.bpm));
    if (params.timeSignature !== undefined) this.timeSignature = params.timeSignature;
    if (params.subdivision !== undefined) this.subdivision = params.subdivision;
    if (params.swingPercent !== undefined) this.swingPercent = Math.max(0, Math.min(65, params.swingPercent));
    if (params.onBeat !== undefined) this.onBeatCallback = params.onBeat;
  }

  private getBeatsPerBar(): number {
    const [num] = this.timeSignature.split('/').map(Number);
    return num || 4;
  }

  private getSubdivisionsPerBeat(): number {
    switch (this.subdivision) {
      case 'eighth':
        return 2;
      case 'triplet':
        return 3;
      case 'sixteenth':
        return 4;
      default:
        return 1;
    }
  }

  public start(): void {
    if (this.running) return;
    const ctx = audioManager.getContext();
    this.running = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.timerId = window.setInterval(() => this.scheduler(), 25);
  }

  public stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler(): void {
    const ctx = audioManager.getContext();
    const lookaheadSec = 0.1;

    while (this.nextNoteTime < ctx.currentTime + lookaheadSec) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  private scheduleStep(step: number, time: number): void {
    const beatsPerBar = this.getBeatsPerBar();
    const subsPerBeat = this.getSubdivisionsPerBeat();
    const totalStepsInBar = beatsPerBar * subsPerBeat;
    const stepInBar = step % totalStepsInBar;
    const isMainBeat = stepInBar % subsPerBeat === 0;
    const beatIndex = Math.floor(stepInBar / subsPerBeat);
    const isAccent = stepInBar === 0;

    // Compound meters (6/8, 12/8) secondary pulse accent
    const isCompoundPulse =
      (this.timeSignature === '6/8' || this.timeSignature === '12/8') &&
      isMainBeat &&
      beatIndex % 3 === 0;

    if (isAccent) {
      triggerMetronomeClick('accent', time);
    } else if (isMainBeat) {
      triggerMetronomeClick(isCompoundPulse ? 'accent' : 'beat', time);
    } else {
      triggerMetronomeClick('subdivision', time);
    }

    if (isMainBeat && this.onBeatCallback) {
      const delayMs = Math.max(0, (time - audioManager.getContext().currentTime) * 1000);
      window.setTimeout(() => {
        if (this.running) {
          this.onBeatCallback?.(beatIndex, beatsPerBar, isAccent);
        }
      }, delayMs);
    }
  }

  private advanceStep(): void {
    const subsPerBeat = this.getSubdivisionsPerBeat();
    const isEighthBar = this.timeSignature.endsWith('/8');
    const beatDurationSec = (60 / this.bpm) * (isEighthBar ? 0.5 : 1);
    let stepDuration = beatDurationSec / subsPerBeat;

    // Apply swing to eighth-note offbeats
    if (this.subdivision === 'eighth' && this.swingPercent > 0) {
      const swingFactor = (this.swingPercent / 100) * 0.34;
      const isDownbeat = this.currentStep % 2 === 0;
      stepDuration = isDownbeat
        ? (beatDurationSec / 2) * (1 + swingFactor)
        : (beatDurationSec / 2) * (1 - swingFactor);
    }

    this.nextNoteTime += stepDuration;
    this.currentStep += 1;
  }
}

export interface TunerReading {
  hz: number;
  midi: number;
  noteIntl: string;
  noteEs: string;
  cents: number;
  clarity: number;
}

/**
 * YIN-inspired time-domain autocorrelation pitch detector tuned specifically for bass frequencies (27 Hz - 480 Hz).
 */
export function detectBassPitchYIN(buffer: Float32Array, sampleRate: number): TunerReading | null {
  const size = buffer.length;
  // Check RMS signal energy
  let rms = 0;
  for (let i = 0; i < size; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.012) return null;

  const minFreq = 27.0; // Below B0 (30.87 Hz)
  const maxFreq = 460.0;
  const maxLag = Math.min(Math.floor(size / 2), Math.floor(sampleRate / minFreq));
  const minLag = Math.max(16, Math.floor(sampleRate / maxFreq));

  const diff = new Float32Array(maxLag + 1);
  for (let tau = minLag; tau <= maxLag; tau++) {
    let sum = 0;
    const limit = size - maxLag;
    for (let i = 0; i < limit; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalized difference function
  const cmndf = new Float32Array(maxLag + 1);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxLag; tau++) {
    runningSum += diff[tau];
    cmndf[tau] = runningSum > 0 ? (diff[tau] * tau) / runningSum : 1;
  }

  const threshold = 0.16;
  let tauEstimate = -1;
  for (let tau = minLag; tau <= maxLag; tau++) {
    if (cmndf[tau] < threshold) {
      while (tau + 1 <= maxLag && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  // Fallback to global minimum if slightly noisy
  if (tauEstimate === -1) {
    let bestVal = 1;
    for (let tau = minLag; tau <= maxLag; tau++) {
      if (cmndf[tau] < bestVal) {
        bestVal = cmndf[tau];
        tauEstimate = tau;
      }
    }
    if (bestVal > 0.35) return null;
  }

  // Parabolic interpolation for sub-sample precision
  let betterTau = tauEstimate;
  if (tauEstimate > minLag && tauEstimate < maxLag) {
    const s0 = cmndf[tauEstimate - 1];
    const s1 = cmndf[tauEstimate];
    const s2 = cmndf[tauEstimate + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (Math.abs(denom) > 1e-6) {
      betterTau = tauEstimate + (s2 - s0) / denom;
    }
  }

  const hz = sampleRate / betterTau;
  if (hz < minFreq || hz > maxFreq) return null;

  const midiFloat = frequencyToMidiFloat(hz);
  const nearestMidi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - nearestMidi) * 100);
  const info = midiToNoteInfo(nearestMidi, false);

  return {
    hz,
    midi: nearestMidi,
    noteIntl: info.intl,
    noteEs: info.es,
    cents,
    clarity: Math.max(0, Math.min(1, 1 - cmndf[tauEstimate])),
  };
}

export interface HarmonicAnalysisResult {
  chromagram: number[]; // 12 values normalized 0..1 (C..B)
  detectedChord: string;
  detectedChordEs: string;
  chordConfidence: number;
  detectedKey: string;
  keyConfidence: number;
  activeBassNote: string;
}

const CHORD_TEMPLATES: { name: string; nameEs: string; intervals: number[] }[] = [
  { name: '', nameEs: 'Mayor', intervals: [0, 4, 7] },
  { name: 'm', nameEs: 'Menor', intervals: [0, 3, 7] },
  { name: '7', nameEs: 'Dominante 7', intervals: [0, 4, 7, 10] },
  { name: 'maj7', nameEs: 'Mayor 7', intervals: [0, 4, 7, 11] },
  { name: 'm7', nameEs: 'Menor 7', intervals: [0, 3, 7, 10] },
  { name: 'm7b5', nameEs: 'Semidisminuido', intervals: [0, 3, 6, 10] },
  { name: 'dim', nameEs: 'Disminuido', intervals: [0, 3, 6] },
  { name: 'sus4', nameEs: 'Suspendido 4', intervals: [0, 5, 7] },
  { name: '5', nameEs: 'Power Chord (5ª)', intervals: [0, 7] },
];

// Krumhansl-Schmuckler tonal hierarchy weights
const MAJOR_KEY_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_KEY_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

/**
 * Computes 12-bin chromagram from FFT byte/float frequency data and identifies chord + song key.
 */
export function analyzeHarmonicSpectrum(
  freqData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  accumulatedKeyChroma: number[]
): HarmonicAnalysisResult {
  const chroma = new Array(12).fill(0);
  const binHz = sampleRate / fftSize;

  let bassPeakEnergy = 0;
  let bassPeakPc = -1;

  // Scan musical range from ~36 Hz (D1) to 1800 Hz
  const minBin = Math.max(1, Math.floor(36 / binHz));
  const maxBin = Math.min(freqData.length - 1, Math.ceil(1800 / binHz));

  for (let bin = minBin; bin <= maxBin; bin++) {
    const magnitude = freqData[bin] / 255;
    if (magnitude < 0.08) continue;

    const hz = bin * binHz;
    const midi = frequencyToMidiFloat(hz);
    const pc = ((Math.round(midi) % 12) + 12) % 12;

    // Emphasize fundamental & lower mid harmonic clarity
    const weight = hz < 300 ? magnitude * magnitude * 1.45 : magnitude * magnitude;
    chroma[pc] += weight;

    if (hz >= 36 && hz <= 220 && weight > bassPeakEnergy) {
      bassPeakEnergy = weight;
      bassPeakPc = pc;
    }
  }

  const maxChroma = Math.max(...chroma, 0.0001);
  const normChroma = chroma.map((v) => v / maxChroma);

  // Decay & accumulate for overall song key stability
  for (let i = 0; i < 12; i++) {
    accumulatedKeyChroma[i] = accumulatedKeyChroma[i] * 0.96 + normChroma[i] * 0.04;
  }

  const energySum = chroma.reduce((s, v) => s + v, 0);
  if (energySum < 0.15) {
    return {
      chromagram: normChroma,
      detectedChord: '—',
      detectedChordEs: 'Esperando señal musical',
      chordConfidence: 0,
      detectedKey: inferKeyFromChroma(accumulatedKeyChroma).label,
      keyConfidence: inferKeyFromChroma(accumulatedKeyChroma).confidence,
      activeBassNote: '—',
    };
  }

  // Chord Template Matching
  let bestChord = '—';
  let bestChordEs = '—';
  let bestScore = -999;

  for (let root = 0; root < 12; root++) {
    for (const tpl of CHORD_TEMPLATES) {
      let score = 0;
      const inChord = new Set(tpl.intervals.map((iv) => (root + iv) % 12));
      for (let pc = 0; pc < 12; pc++) {
        if (inChord.has(pc)) {
          // Bonus for root & bass fundamental alignment
          const rootBoost = pc === root ? 1.3 : 1.0;
          score += normChroma[pc] * rootBoost;
        } else {
          score -= normChroma[pc] * 0.65;
        }
      }
      if (bassPeakPc === root) {
        score += 0.35;
      }
      const normalizedScore = score / (tpl.intervals.length + 0.5);
      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
        bestChord = `${NOTE_NAMES_SHARP[root]}${tpl.name}`;
        bestChordEs = `${NOTE_NAMES_ES_SHARP[root]} ${tpl.nameEs}`;
      }
    }
  }

  const keyResult = inferKeyFromChroma(accumulatedKeyChroma);

  return {
    chromagram: normChroma,
    detectedChord: bestChord,
    detectedChordEs: bestChordEs,
    chordConfidence: Math.max(0, Math.min(100, Math.round(bestScore * 100))),
    detectedKey: keyResult.label,
    keyConfidence: keyResult.confidence,
    activeBassNote: bassPeakPc >= 0 ? `${NOTE_NAMES_SHARP[bassPeakPc]} (${NOTE_NAMES_ES_SHARP[bassPeakPc]})` : '—',
  };
}

function inferKeyFromChroma(chroma: number[]): { label: string; confidence: number } {
  const sum = chroma.reduce((s, v) => s + v, 0);
  if (sum < 0.05) return { label: 'Analizando...', confidence: 0 };

  let bestLabel = 'Do Mayor';
  let bestCorr = -1;

  for (let root = 0; root < 12; root++) {
    const rotatedMajor = new Array(12).fill(0).map((_, i) => chroma[(i + root) % 12]);
    const majCorr = pearsonCorrelation(rotatedMajor, MAJOR_KEY_PROFILE);
    if (majCorr > bestCorr) {
      bestCorr = majCorr;
      bestLabel = `${NOTE_NAMES_ES_SHARP[root]} Mayor (${NOTE_NAMES_SHARP[root]})`;
    }

    const minCorr = pearsonCorrelation(rotatedMajor, MINOR_KEY_PROFILE);
    if (minCorr > bestCorr) {
      bestCorr = minCorr;
      bestLabel = `${NOTE_NAMES_ES_SHARP[root]} Menor (${NOTE_NAMES_SHARP[root]}m)`;
    }
  }

  return {
    label: bestLabel,
    confidence: Math.max(0, Math.min(100, Math.round(((bestCorr + 1) / 2) * 100))),
  };
}
