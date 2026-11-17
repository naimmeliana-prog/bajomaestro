import { TuningPreset } from '../types/music';

export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export const NOTE_NAMES_ES_SHARP = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
] as const;

export const NOTE_NAMES_ES_FLAT = [
  'Do',
  'Reb',
  'Re',
  'Mib',
  'Mi',
  'Fa',
  'Solb',
  'Sol',
  'Lab',
  'La',
  'Sib',
  'Si',
] as const;

export const TUNING_PRESETS: TuningPreset[] = [
  {
    id: '4-standard',
    name: '4 Cuerdas Estándar (E-A-D-G)',
    stringsCount: 4,
    description: 'Afinación estándar universal para bajo eléctrico de 4 cuerdas y contrabajo acústico.',
    strings: [
      { label: 'G', noteEs: 'Sol2', midi: 43, hz: 98.0 },
      { label: 'D', noteEs: 'Re2', midi: 38, hz: 73.42 },
      { label: 'A', noteEs: 'La1', midi: 33, hz: 55.0 },
      { label: 'E', noteEs: 'Mi1', midi: 28, hz: 41.2 },
    ],
  },
  {
    id: '4-drop-d',
    name: '4 Cuerdas Drop D (D-A-D-G)',
    stringsCount: 4,
    description: 'Muy usada en Rock, Metal Progresivo, Grunge y arreglos acústicos modernos.',
    strings: [
      { label: 'G', noteEs: 'Sol2', midi: 43, hz: 98.0 },
      { label: 'D', noteEs: 'Re2', midi: 38, hz: 73.42 },
      { label: 'A', noteEs: 'La1', midi: 33, hz: 55.0 },
      { label: 'D', noteEs: 'Re1', midi: 26, hz: 36.71 },
    ],
  },
  {
    id: '4-half-down',
    name: '4 Cuerdas ½ Tono Abajo (Eb-Ab-Db-Gb)',
    stringsCount: 4,
    description: 'Estándar en Blues Rock (Stevie Ray Vaughan / Hendrix), Hard Rock y Metal clásico.',
    strings: [
      { label: 'Gb', noteEs: 'Solb2', midi: 42, hz: 92.5 },
      { label: 'Db', noteEs: 'Reb2', midi: 37, hz: 69.3 },
      { label: 'Ab', noteEs: 'Lab1', midi: 32, hz: 51.91 },
      { label: 'Eb', noteEs: 'Mib1', midi: 27, hz: 38.89 },
    ],
  },
  {
    id: '5-standard',
    name: '5 Cuerdas Estándar (B-E-A-D-G)',
    stringsCount: 5,
    description: 'Incluye cuerda B grave (Si0 · 30.87 Hz) esencial para R&B, Gospel, Funk, Metal y Pop moderno.',
    strings: [
      { label: 'G', noteEs: 'Sol2', midi: 43, hz: 98.0 },
      { label: 'D', noteEs: 'Re2', midi: 38, hz: 73.42 },
      { label: 'A', noteEs: 'La1', midi: 33, hz: 55.0 },
      { label: 'E', noteEs: 'Mi1', midi: 28, hz: 41.2 },
      { label: 'B', noteEs: 'Si0', midi: 23, hz: 30.87 },
    ],
  },
  {
    id: '5-high-c',
    name: '5 Cuerdas Tenor / C Agudo (E-A-D-G-C)',
    stringsCount: 5,
    description: 'Ideal para solistas, Jazz Fusion, Chord Voicings y arreglos melódicos en registro agudo.',
    strings: [
      { label: 'C', noteEs: 'Do3', midi: 48, hz: 130.81 },
      { label: 'G', noteEs: 'Sol2', midi: 43, hz: 98.0 },
      { label: 'D', noteEs: 'Re2', midi: 38, hz: 73.42 },
      { label: 'A', noteEs: 'La1', midi: 33, hz: 55.0 },
      { label: 'E', noteEs: 'Mi1', midi: 28, hz: 41.2 },
    ],
  },
  {
    id: '6-standard',
    name: '6 Cuerdas Estándar (B-E-A-D-G-C)',
    stringsCount: 6,
    description: 'Rango completo desde B0 grave hasta C3 agudo para Jazz, Latin Fusion y solo bass.',
    strings: [
      { label: 'C', noteEs: 'Do3', midi: 48, hz: 130.81 },
      { label: 'G', noteEs: 'Sol2', midi: 43, hz: 98.0 },
      { label: 'D', noteEs: 'Re2', midi: 38, hz: 73.42 },
      { label: 'A', noteEs: 'La1', midi: 33, hz: 55.0 },
      { label: 'E', noteEs: 'Mi1', midi: 28, hz: 41.2 },
      { label: 'B', noteEs: 'Si0', midi: 23, hz: 30.87 },
    ],
  },
];

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function frequencyToMidiFloat(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function midiToNoteInfo(midi: number, preferFlats = false) {
  const rounded = Math.round(midi);
  const pitchClass = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  const intl = preferFlats ? NOTE_NAMES_FLAT[pitchClass] : NOTE_NAMES_SHARP[pitchClass];
  const es = preferFlats ? NOTE_NAMES_ES_FLAT[pitchClass] : NOTE_NAMES_ES_SHARP[pitchClass];
  return {
    midi: rounded,
    pitchClass,
    octave,
    intl: `${intl}${octave}`,
    intlBase: intl,
    es: `${es}${octave}`,
    esBase: es,
  };
}

/**
 * Given a MIDI pitch and tuning preset, pick a natural bass string + fret position.
 * Returns stringIndex (0 = highest string in preset, e.g., G) and fret (0..20).
 */
export function findBestStringAndFret(
  midi: number,
  tuning: TuningPreset = TUNING_PRESETS[0],
  preferredStringNum?: number,
  preferredFret?: number
): { stringIndex: number; fret: number } {
  if (
    preferredStringNum !== undefined &&
    preferredFret !== undefined &&
    preferredStringNum >= 1 &&
    preferredStringNum <= tuning.strings.length
  ) {
    return { stringIndex: preferredStringNum - 1, fret: preferredFret };
  }

  // Prefer open strings or frets 1..7 when ergonomic
  let best = { stringIndex: tuning.strings.length - 1, fret: Math.max(0, midi - tuning.strings[tuning.strings.length - 1].midi) };
  let bestScore = 999;

  tuning.strings.forEach((str, idx) => {
    const fret = midi - str.midi;
    if (fret >= 0 && fret <= 20) {
      // Score favors frets 0..7 and middle positions
      const score = fret === 0 ? 0.5 : fret <= 5 ? fret : fret <= 12 ? fret + 2 : fret + 8;
      if (score < bestScore) {
        bestScore = score;
        best = { stringIndex: idx, fret };
      }
    }
  });

  return best;
}

/**
 * Bass Clef (Clave de Fa) staff step calculation.
 * In Bass Clef:
 * - Bottom line (line 0) = G2 (MIDI 43) -> diatonic step = 2*7 + 4 = 18
 * - Top line (line 4) = A3 (MIDI 57) -> diatonic step = 3*7 + 5 = 26
 * Wait! Remember bass guitar sounds ONE OCTAVE LOWER than written!
 * Standard written bass clef puts open E1 (sounding 41.2 Hz, MIDI 28) on the ledger line below bass staff (written E2, MIDI 40),
 * open A1 (MIDI 33) on bottom space / line 1 written A2 (MIDI 45),
 * open D2 (MIDI 38) on middle line D3 (MIDI 50),
 * open G2 (MIDI 43) on top space G3 (MIDI 55)!
 * This is crucial for authentic bass reading!
 */
const DIATONIC_INDEX_SHARP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
const IS_ACCIDENTAL_SHARP = [false, true, false, true, false, false, true, false, true, false, true, false];
const DIATONIC_INDEX_FLAT = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const IS_ACCIDENTAL_FLAT = [false, true, false, true, false, false, true, false, true, false, true, false];

export function midiToWrittenBassClefPosition(soundingMidi: number, preferFlats = false) {
  // Written bass pitch is 12 semitones (+1 octave) above sounding pitch
  const writtenMidi = soundingMidi + 12;
  const pitchClass = ((writtenMidi % 12) + 12) % 12;
  const octave = Math.floor(writtenMidi / 12) - 1;
  const letterIndex = preferFlats ? DIATONIC_INDEX_FLAT[pitchClass] : DIATONIC_INDEX_SHARP[pitchClass];
  const hasAccidental = preferFlats ? IS_ACCIDENTAL_FLAT[pitchClass] : IS_ACCIDENTAL_SHARP[pitchClass];
  const accidentalSymbol = hasAccidental ? (preferFlats ? 'b' : '#') : '';

  // Diatonic step relative to C0
  const diatonicStep = octave * 7 + letterIndex;
  // In Bass Clef, bottom line is G2 -> octave 2, letter G (4) -> step = 2*7 + 4 = 18
  // Each staff line/space increment = 1 step. Lines are at steps 18 (G2), 20 (B2), 22 (D3), 24 (F3), 26 (A3)
  const stepFromBottomLine = diatonicStep - 18;

  return {
    stepFromBottomLine,
    accidentalSymbol,
    writtenMidi,
  };
}

export const KEY_FLAT_PREFERENCE: Record<string, boolean> = {
  C: false,
  G: false,
  D: false,
  A: false,
  E: false,
  B: false,
  'F#': false,
  F: true,
  Bb: true,
  Eb: true,
  Ab: true,
  Db: true,
  Am: false,
  Em: false,
  Bm: false,
  'F#m': false,
  'C#m': false,
  Dm: true,
  Gm: true,
  Cm: true,
  Fm: true,
};
