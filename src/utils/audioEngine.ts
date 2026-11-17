import { NoteEvent, NoteTechniqueTag, TimeSignature } from '../types/music';
import {
  frequencyToMidiFloat,
  midiToFrequency,
  midiToNoteInfo,
  NOTE_NAMES_ES_SHARP,
  NOTE_NAMES_SHARP,
} from './musicTheory';

export type BassToneMode = 'electric_finger' | 'electric_pick' | 'electric_slap' | 'acoustic_upright';
export type MetronomeSubdivision = 'quarter' | 'eighth' | 'triplet' | 'sixteenth' | 'gallop';
export type BeatAccentLevel = 'accent' | 'normal' | 'mute';

class AudioContextManager {
  private ctx: AudioContext | null = null;
  private bassBusInput: GainNode | null = null;
  private woundWave: PeriodicWave | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private metronomeGain: GainNode | null = null;

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Studio bass preamp + tube warmth + speaker cabinet bus so notes sound rich and organic.
   */
  public getBassBus(): GainNode {
    const ctx = this.getContext();
    if (this.bassBusInput) return this.bassBusInput;

    const input = ctx.createGain();
    input.gain.value = 0.95;

    // Low-end weight shelf (85 Hz)
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 88;
    lowShelf.gain.value = 4.2;

    // Woody Precision/Jazz midrange punch (190 Hz)
    const bodyPeak = ctx.createBiquadFilter();
    bodyPeak.type = 'peaking';
    bodyPeak.frequency.value = 190;
    bodyPeak.Q.value = 0.85;
    bodyPeak.gain.value = 2.4;

    // Subtle scoop around muddy 360 Hz
    const mudDip = ctx.createBiquadFilter();
    mudDip.type = 'peaking';
    mudDip.frequency.value = 360;
    mudDip.Q.value = 1.2;
    mudDip.gain.value = -2.0;

    // Gentle asymmetric tube saturation curve
    const shaper = ctx.createWaveShaper();
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * 1.45) * 0.92;
    }
    shaper.curve = curve;
    shaper.oversample = '2x';

    // Bass cabinet 10"/15" speaker roll-off
    const cabFilter = ctx.createBiquadFilter();
    cabFilter.type = 'lowpass';
    cabFilter.frequency.value = 2900;
    cabFilter.Q.value = 0.7;

    // Tight studio glue compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 12;
    compressor.ratio.value = 3.8;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.14;

    const output = ctx.createGain();
    output.gain.value = 0.9;

    input.connect(lowShelf);
    lowShelf.connect(bodyPeak);
    bodyPeak.connect(mudDip);
    mudDip.connect(shaper);
    shaper.connect(cabFilter);
    cabFilter.connect(compressor);
    compressor.connect(output);
    output.connect(ctx.destination);

    this.bassBusInput = input;
    return input;
  }

  /**
   * Custom PeriodicWave modeled after a steel/nickel wound bass string harmonic spectrum.
   */
  public getWoundStringWave(): PeriodicWave {
    const ctx = this.getContext();
    if (this.woundWave) return this.woundWave;

    const harmonics = 28;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    real[0] = 0;
    imag[0] = 0;

    for (let n = 1; n < harmonics; n++) {
      // Natural string harmonic rolloff + mild magnetic pickup comb attenuation
      const pickupNotch = 1 - 0.18 * Math.cos((n * Math.PI) / 4.5);
      imag[n] = (1 / Math.pow(n, 1.32)) * pickupNotch;
    }

    this.woundWave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    return this.woundWave;
  }

  /**
   * Short noise buffer used to synthesize physical finger flesh, pick click, and fret transient.
   */
  public getNoiseBuffer(): AudioBuffer {
    const ctx = this.getContext();
    if (this.noiseBuffer) return this.noiseBuffer;
    const len = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
    return buf;
  }

  public getMetronomeGain(): GainNode {
    const ctx = this.getContext();
    if (!this.metronomeGain) {
      this.metronomeGain = ctx.createGain();
      this.metronomeGain.gain.value = 0.75;
      this.metronomeGain.connect(ctx.destination);
    }
    return this.metronomeGain;
  }
}

export const audioManager = new AudioContextManager();

/**
 * Physical-modeling Web Audio electric and acoustic bass synthesizer.
 */
export function playBassNote(
  midi: number,
  durationSec = 0.55,
  mode: BassToneMode = 'electric_finger',
  technique: NoteTechniqueTag = 'normal',
  whenOffsetSec = 0
): void {
  const ctx = audioManager.getContext();
  const bus = audioManager.getBassBus();
  const woundWave = audioManager.getWoundStringWave();
  const noiseBuf = audioManager.getNoiseBuffer();

  const startTime = ctx.currentTime + whenOffsetSec;
  const freq = midiToFrequency(midi);
  const effectiveDuration =
    technique === 'staccato'
      ? Math.min(0.16, durationSec * 0.45)
      : technique === 'ghost'
        ? 0.085
        : Math.max(0.24, durationSec * 0.98);

  const noteOut = ctx.createGain();
  const stringFilter = ctx.createBiquadFilter();
  stringFilter.type = 'lowpass';

  // Fundamental sub oscillator (pure low weight)
  const oscSub = ctx.createOscillator();
  oscSub.type = 'sine';
  oscSub.frequency.setValueAtTime(freq, startTime);

  // Two slightly detuned wound-string oscillators for rich organic chorus/string thickness
  const oscStrA = ctx.createOscillator();
  const oscStrB = ctx.createOscillator();
  oscStrA.setPeriodicWave(woundWave);
  oscStrB.setPeriodicWave(woundWave);

  // Micro-pitch pluck elasticity (+5 cents bend settling in 24ms)
  const initialDetune = technique === 'slap' || mode === 'acoustic_upright' ? 9 : 5;
  oscSub.frequency.setValueAtTime(freq * Math.pow(2, initialDetune / 1200), startTime);
  oscSub.frequency.exponentialRampToValueAtTime(freq, startTime + 0.026);

  oscStrA.frequency.setValueAtTime(freq * Math.pow(2, (initialDetune - 1.4) / 1200), startTime);
  oscStrA.frequency.exponentialRampToValueAtTime(freq * 0.9992, startTime + 0.028);

  oscStrB.frequency.setValueAtTime(freq * Math.pow(2, (initialDetune + 1.6) / 1200), startTime);
  oscStrB.frequency.exponentialRampToValueAtTime(freq * 1.0008, startTime + 0.028);

  const subGain = ctx.createGain();
  const strGain = ctx.createGain();

  // Physical pluck / fret / wood transient noise
  const transientSrc = ctx.createBufferSource();
  transientSrc.buffer = noiseBuf;
  const transientFilter = ctx.createBiquadFilter();
  transientFilter.type = 'bandpass';
  const transientGain = ctx.createGain();

  if (technique === 'ghost') {
    subGain.gain.setValueAtTime(0.14, startTime);
    strGain.gain.setValueAtTime(0.22, startTime);
    stringFilter.frequency.setValueAtTime(580, startTime);
    stringFilter.frequency.exponentialRampToValueAtTime(160, startTime + 0.07);
    transientFilter.frequency.setValueAtTime(620, startTime);
    transientFilter.Q.value = 1.8;
    transientGain.gain.setValueAtTime(0.32, startTime);
    transientGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.032);
    noteOut.gain.setValueAtTime(0.001, startTime);
    noteOut.gain.linearRampToValueAtTime(0.36, startTime + 0.004);
    noteOut.gain.exponentialRampToValueAtTime(0.001, startTime + 0.085);
  } else if (technique === 'harmonic') {
    oscSub.frequency.setValueAtTime(freq * 2, startTime);
    oscStrA.frequency.setValueAtTime(freq * 2, startTime);
    oscStrB.frequency.setValueAtTime(freq * 4, startTime);
    subGain.gain.setValueAtTime(0.42, startTime);
    strGain.gain.setValueAtTime(0.14, startTime);
    stringFilter.frequency.setValueAtTime(3400, startTime);
    transientGain.gain.setValueAtTime(0.04, startTime);
    transientGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.02);
    noteOut.gain.setValueAtTime(0.001, startTime);
    noteOut.gain.linearRampToValueAtTime(0.48, startTime + 0.014);
    noteOut.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(0.7, durationSec * 1.5));
  } else if (mode === 'acoustic_upright') {
    // Warm upright/acoustic resonance with wooden thump & quick bloom
    subGain.gain.setValueAtTime(0.7, startTime);
    strGain.gain.setValueAtTime(0.34, startTime);
    stringFilter.Q.setValueAtTime(1.8, startTime);
    stringFilter.frequency.setValueAtTime(920, startTime);
    stringFilter.frequency.exponentialRampToValueAtTime(215, startTime + Math.min(0.34, effectiveDuration));

    transientFilter.frequency.setValueAtTime(310, startTime);
    transientFilter.Q.value = 1.4;
    transientGain.gain.setValueAtTime(0.28, startTime);
    transientGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);

    noteOut.gain.setValueAtTime(0.001, startTime);
    noteOut.gain.linearRampToValueAtTime(0.68, startTime + 0.015);
    noteOut.gain.exponentialRampToValueAtTime(0.24, startTime + Math.min(0.3, effectiveDuration * 0.55));
    noteOut.gain.exponentialRampToValueAtTime(0.001, startTime + effectiveDuration);
  } else if (mode === 'electric_slap' || technique === 'slap' || technique === 'pop') {
    // Percussive string slap / metallic fret clank
    subGain.gain.setValueAtTime(0.55, startTime);
    strGain.gain.setValueAtTime(0.62, startTime);
    stringFilter.Q.setValueAtTime(2.6, startTime);
    stringFilter.frequency.setValueAtTime(technique === 'pop' ? 3300 : 2550, startTime);
    stringFilter.frequency.exponentialRampToValueAtTime(340, startTime + 0.24);

    transientFilter.frequency.setValueAtTime(technique === 'pop' ? 2800 : 1950, startTime);
    transientFilter.Q.value = 1.6;
    transientGain.gain.setValueAtTime(0.38, startTime);
    transientGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.028);

    noteOut.gain.setValueAtTime(0.001, startTime);
    noteOut.gain.linearRampToValueAtTime(0.74, startTime + 0.003);
    noteOut.gain.exponentialRampToValueAtTime(0.22, startTime + 0.14);
    noteOut.gain.exponentialRampToValueAtTime(0.001, startTime + effectiveDuration);
  } else if (mode === 'electric_pick') {
    subGain.gain.setValueAtTime(0.52, startTime);
    strGain.gain.setValueAtTime(0.56, startTime);
    stringFilter.Q.setValueAtTime(1.8, startTime);
    stringFilter.frequency.setValueAtTime(2150, startTime);
    stringFilter.frequency.exponentialRampToValueAtTime(420, startTime + 0.26);

    transientFilter.frequency.setValueAtTime(2350, startTime);
    transientFilter.Q.value = 2.0;
    transientGain.gain.setValueAtTime(0.25, startTime);
    transientGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.018);

    noteOut.gain.setValueAtTime(0.001, startTime);
    noteOut.gain.linearRampToValueAtTime(0.64, startTime + 0.004);
    noteOut.gain.exponentialRampToValueAtTime(0.28, startTime + effectiveDuration * 0.6);
    noteOut.gain.exponentialRampToValueAtTime(0.001, startTime + effectiveDuration);
  } else {
    // electric_finger: warm magnetic Precision/Jazz fingerstyle tone
    subGain.gain.setValueAtTime(0.64, startTime);
    strGain.gain.setValueAtTime(0.46, startTime);
    stringFilter.Q.setValueAtTime(1.45, startTime);
    stringFilter.frequency.setValueAtTime(technique === 'accent' ? 1680 : 1220, startTime);
    stringFilter.frequency.exponentialRampToValueAtTime(260, startTime + Math.min(0.42, effectiveDuration));

    transientFilter.frequency.setValueAtTime(760, startTime);
    transientFilter.Q.value = 1.5;
    transientGain.gain.setValueAtTime(0.18, startTime);
    transientGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.022);

    noteOut.gain.setValueAtTime(0.001, startTime);
    noteOut.gain.linearRampToValueAtTime(technique === 'accent' ? 0.68 : 0.58, startTime + 0.008);
    noteOut.gain.exponentialRampToValueAtTime(0.26, startTime + effectiveDuration * 0.6);
    noteOut.gain.exponentialRampToValueAtTime(0.001, startTime + effectiveDuration);
  }

  oscSub.connect(subGain);
  oscStrA.connect(strGain);
  oscStrB.connect(strGain);
  subGain.connect(stringFilter);
  strGain.connect(stringFilter);

  transientSrc.connect(transientFilter);
  transientFilter.connect(transientGain);
  transientGain.connect(noteOut);

  stringFilter.connect(noteOut);
  noteOut.connect(bus);

  const stopTime = startTime + Math.max(0.26, effectiveDuration) + 0.06;
  oscSub.start(startTime);
  oscStrA.start(startTime);
  oscStrB.start(startTime);
  transientSrc.start(startTime);

  oscSub.stop(stopTime);
  oscStrA.stop(stopTime);
  oscStrB.stop(stopTime);
  transientSrc.stop(startTime + 0.06);
}

/**
 * Plays a steady studio reference pitch for ear tuning.
 */
export function playReferencePitch(hz: number, durationSec = 2.0): void {
  const ctx = audioManager.getContext();
  const bus = audioManager.getBassBus();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(hz, now);
  osc2.setPeriodicWave(audioManager.getWoundStringWave());
  osc2.frequency.setValueAtTime(hz, now);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.45, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.max(480, hz * 5.5), now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.48, now + 0.03);
  gain.gain.setValueAtTime(0.44, now + durationSec - 0.18);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  osc.connect(filter);
  osc2.connect(g2);
  g2.connect(filter);
  filter.connect(gain);
  gain.connect(bus);

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
  const masterGain = audioManager.getMetronomeGain();
  const time = whenTime ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = kind === 'subdivision' ? 'triangle' : 'sine';
  const freq = kind === 'accent' ? 1480 : kind === 'beat' ? 920 : 610;
  const peak = kind === 'accent' ? 0.65 : kind === 'beat' ? 0.36 : 0.18;

  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.042);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.05);
}

/**
 * Precision Web Audio Lookahead Metronome Engine with per-beat accents and master volume.
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
  private volume = 0.75;
  private beatAccents: BeatAccentLevel[] = ['accent', 'normal', 'normal', 'normal'];
  private onBeatCallback?: (
    beatIndex: number,
    totalBeats: number,
    accentLevel: BeatAccentLevel,
    isSubdivision: boolean
  ) => void;

  public configure(params: {
    bpm?: number;
    timeSignature?: TimeSignature;
    subdivision?: MetronomeSubdivision;
    swingPercent?: number;
    volume?: number;
    beatAccents?: BeatAccentLevel[];
    onBeat?: (
      beatIndex: number,
      totalBeats: number,
      accentLevel: BeatAccentLevel,
      isSubdivision: boolean
    ) => void;
  }) {
    if (params.bpm !== undefined) this.bpm = Math.max(30, Math.min(260, params.bpm));
    if (params.timeSignature !== undefined) this.timeSignature = params.timeSignature;
    if (params.subdivision !== undefined) this.subdivision = params.subdivision;
    if (params.swingPercent !== undefined) this.swingPercent = Math.max(0, Math.min(65, params.swingPercent));
    if (params.beatAccents !== undefined) this.beatAccents = params.beatAccents;
    if (params.volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, params.volume));
      const g = audioManager.getMetronomeGain();
      g.gain.setTargetAtTime(this.volume, audioManager.getContext().currentTime, 0.015);
    }
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
      case 'gallop':
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
    audioManager.getMetronomeGain().gain.setValueAtTime(this.volume, ctx.currentTime);
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
    const subIndex = stepInBar % subsPerBeat;

    const beatAccent: BeatAccentLevel =
      this.beatAccents[beatIndex] ?? (beatIndex === 0 ? 'accent' : 'normal');

    if (isMainBeat) {
      if (beatAccent === 'accent') {
        triggerMetronomeClick('accent', time);
      } else if (beatAccent === 'normal') {
        triggerMetronomeClick('beat', time);
      }
    } else if (beatAccent !== 'mute') {
      triggerMetronomeClick('subdivision', time);
    }

    if (this.onBeatCallback && (isMainBeat || subIndex > 0)) {
      const delayMs = Math.max(0, (time - audioManager.getContext().currentTime) * 1000);
      window.setTimeout(() => {
        if (this.running) {
          this.onBeatCallback?.(beatIndex, beatsPerBar, beatAccent, !isMainBeat);
        }
      }, delayMs);
    }
  }

  private advanceStep(): void {
    const subsPerBeat = this.getSubdivisionsPerBeat();
    const isEighthBar = this.timeSignature.endsWith('/8');
    const beatDurationSec = (60 / this.bpm) * (isEighthBar ? 0.5 : 1);
    let stepDuration = beatDurationSec / subsPerBeat;

    if (this.subdivision === 'gallop') {
      const subStep = this.currentStep % 3;
      // 8th (0.5) + 16th (0.25) + 16th (0.25)
      stepDuration = subStep === 0 ? beatDurationSec * 0.5 : beatDurationSec * 0.25;
    } else if (this.subdivision === 'eighth' && this.swingPercent > 0) {
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
  targetHz: number;
  midi: number;
  noteIntl: string;
  noteEs: string;
  cents: number;
  centsFloat: number;
  clarity: number;
  rmsLevel: number;
}

export function computeRmsLevel(buffer: Float32Array): number {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i++) {
    rms += buffer[i] * buffer[i];
  }
  return Math.sqrt(rms / size);
}

export function detectBassPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  a4Hz = 440
): TunerReading | null {
  const size = buffer.length;
  const rms = computeRmsLevel(buffer);
  if (rms < 0.008) return null;

  const minFreq = 27.0;
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

  if (tauEstimate === -1) {
    let bestVal = 1;
    for (let tau = minLag; tau <= maxLag; tau++) {
      if (cmndf[tau] < bestVal) {
        bestVal = cmndf[tau];
        tauEstimate = tau;
      }
    }
    if (bestVal > 0.34) return null;
  }

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

  const midiFloat = 69 + 12 * Math.log2(hz / a4Hz);
  const nearestMidi = Math.round(midiFloat);
  const centsFloat = (midiFloat - nearestMidi) * 100;
  const cents = Math.round(centsFloat);
  const targetHz = a4Hz * Math.pow(2, (nearestMidi - 69) / 12);
  const info = midiToNoteInfo(nearestMidi, false);

  return {
    hz,
    targetHz,
    midi: nearestMidi,
    noteIntl: info.intl,
    noteEs: info.es,
    cents,
    centsFloat,
    clarity: Math.max(0, Math.min(1, 1 - cmndf[tauEstimate])),
    rmsLevel: Math.min(1, rms * 6),
  };
}

export interface HarmonicAnalysisResult {
  chromagram: number[];
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

  const minBin = Math.max(1, Math.floor(36 / binHz));
  const maxBin = Math.min(freqData.length - 1, Math.ceil(1800 / binHz));

  for (let bin = minBin; bin <= maxBin; bin++) {
    const magnitude = freqData[bin] / 255;
    if (magnitude < 0.08) continue;

    const hz = bin * binHz;
    const midi = frequencyToMidiFloat(hz);
    const pc = ((Math.round(midi) % 12) + 12) % 12;

    const weight = hz < 300 ? magnitude * magnitude * 1.45 : magnitude * magnitude;
    chroma[pc] += weight;

    if (hz >= 36 && hz <= 220 && weight > bassPeakEnergy) {
      bassPeakEnergy = weight;
      bassPeakPc = pc;
    }
  }

  const maxChroma = Math.max(...chroma, 0.0001);
  const normChroma = chroma.map((v) => v / maxChroma);

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

  let bestChord = '—';
  let bestChordEs = '—';
  let bestScore = -999;

  for (let root = 0; root < 12; root++) {
    for (const tpl of CHORD_TEMPLATES) {
      let score = 0;
      const inChord = new Set(tpl.intervals.map((iv) => (root + iv) % 12));
      for (let pc = 0; pc < 12; pc++) {
        if (inChord.has(pc)) {
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
    activeBassNote:
      bassPeakPc >= 0 ? `${NOTE_NAMES_SHARP[bassPeakPc]} (${NOTE_NAMES_ES_SHARP[bassPeakPc]})` : '—',
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
