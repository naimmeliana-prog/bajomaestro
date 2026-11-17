import { DifficultyLevel, NoteEvent, SightReadingEtude, TimeSignature } from '../types/music';
import { findBestStringAndFret, TUNING_PRESETS } from '../utils/musicTheory';

export const CURATED_SIGHT_READING: SightReadingEtude[] = [
  {
    id: 'sr-aura-lee',
    title: 'Estudio 1 · Aura Lee (Lectura en Blancas y Negras)',
    level: 'Principiante',
    timeSignature: '4/4',
    keySignature: 'C',
    bpm: 76,
    genre: 'Lectura Musical',
    subgenre: 'Melodía Diatónica',
    artist: 'Tradicional / Gary Turner',
    album: 'Bass Guitar Beginner to Advanced',
    sourceLabel: 'Gary Turner · Sección 1 (Lectura Clave de Fa)',
    pdfSourceId: 'pdf-progressive-bass',
    sightReadingTip: 'Lee cada compás un pulso por delante de lo que tocas. Mantén el pie marcando negras constantes.',
    notes: [
      { midi: 36, durationBeats: 1, chordSymbol: 'C' },
      { midi: 41, durationBeats: 1 },
      { midi: 40, durationBeats: 1 },
      { midi: 41, durationBeats: 1 },
      { midi: 43, durationBeats: 1, chordSymbol: 'G7' },
      { midi: 38, durationBeats: 1 },
      { midi: 43, durationBeats: 2 },
      { midi: 41, durationBeats: 1, chordSymbol: 'F' },
      { midi: 40, durationBeats: 1 },
      { midi: 38, durationBeats: 1, chordSymbol: 'G7' },
      { midi: 40, durationBeats: 1 },
      { midi: 41, durationBeats: 4, chordSymbol: 'C' },
    ],
  },
  {
    id: 'sr-putter-smith-8ths',
    title: 'Estudio 2 · Lectura en Corcheas y Silencios (Método Putter Smith)',
    level: 'Principiante',
    timeSignature: '4/4',
    keySignature: 'G',
    bpm: 84,
    genre: 'Lectura Musical',
    subgenre: 'Corcheas y Contratiempos',
    artist: 'Putter Smith / Adrian Ashton',
    album: 'Curso Completo de Bajo Eléctrico',
    sourceLabel: 'Adrian Ashton · Lectura de partituras (Sol Mayor)',
    pdfSourceId: 'pdf-adrian-ashton',
    sightReadingTip: 'En Sol Mayor recuerda que todos los Fa son Fa#. Respeta los silencios de corchea apagando la cuerda con el dedo libre.',
    notes: [
      { midi: 31, durationBeats: 1, chordSymbol: 'G' },
      { midi: 35, durationBeats: 0.5 },
      { midi: 38, durationBeats: 0.5 },
      { midi: 43, durationBeats: 1 },
      { midi: 42, durationBeats: 0.5 },
      { midi: 38, durationBeats: 0.5 },
      { midi: 36, durationBeats: 1, chordSymbol: 'C' },
      { midi: 36, durationBeats: 0.5, isRest: true },
      { midi: 40, durationBeats: 0.5 },
      { midi: 38, durationBeats: 1, chordSymbol: 'D7' },
      { midi: 33, durationBeats: 1 },
    ],
  },
  {
    id: 'sr-blues-walk-f',
    title: 'Estudio 3 · Walking Blues en Fa (Con Bemoles y Ligaduras)',
    level: 'Intermedio',
    timeSignature: '4/4',
    keySignature: 'F',
    bpm: 100,
    genre: 'Blues',
    subgenre: 'Lectura Walking Blues',
    artist: 'Ed Friedland',
    album: 'Blues Bass',
    sourceLabel: 'Ed Friedland · Lectura de Walking Blues en Fa',
    pdfSourceId: 'pdf-blues-bass',
    sightReadingTip: 'Observa la armadura de Fa Mayor (Sib). Enlaza F7 hacia Bb7 mediante aproximaciones de semitono.',
    notes: [
      { midi: 29, durationBeats: 1, chordSymbol: 'F7' },
      { midi: 33, durationBeats: 1 },
      { midi: 36, durationBeats: 1 },
      { midi: 35, durationBeats: 1 },
      { midi: 34, durationBeats: 1, chordSymbol: 'Bb7' },
      { midi: 38, durationBeats: 1 },
      { midi: 41, durationBeats: 1 },
      { midi: 40, durationBeats: 1 },
      { midi: 36, durationBeats: 1, chordSymbol: 'C7' },
      { midi: 34, durationBeats: 1, chordSymbol: 'Bb7' },
      { midi: 33, durationBeats: 1, chordSymbol: 'F7' },
      { midi: 36, durationBeats: 1, chordSymbol: 'C7' },
    ],
  },
  {
    id: 'sr-reggae-syncopation',
    title: 'Estudio 4 · Síncopa Jamaicana y Puntillos en Re Menor',
    level: 'Intermedio',
    timeSignature: '4/4',
    keySignature: 'Dm',
    bpm: 78,
    genre: 'Reggae',
    subgenre: 'Lectura Sincopada',
    artist: 'Aston Barrett / Ed Friedland',
    album: 'Reggae Bass (Bass Builders)',
    sourceLabel: 'Ed Friedland · Lectura Reggae en Dm',
    pdfSourceId: 'pdf-reggae-bass',
    sightReadingTip: 'Presta mucha atención al primer silencio de negra. Entra sólido sobre el tiempo 2 y deja respirar el compás 2.',
    notes: [
      { midi: 38, durationBeats: 1, isRest: true, chordSymbol: 'Dm' },
      { midi: 38, durationBeats: 0.5 },
      { midi: 41, durationBeats: 0.5 },
      { midi: 45, durationBeats: 1.5 },
      { midi: 41, durationBeats: 0.5 },
      { midi: 36, durationBeats: 1, chordSymbol: 'C' },
      { midi: 36, durationBeats: 1, isRest: true },
      { midi: 40, durationBeats: 1 },
      { midi: 38, durationBeats: 1, chordSymbol: 'Dm' },
    ],
  },
  {
    id: 'sr-compound-68',
    title: 'Estudio 5 · Arpegios Fluidos en 6/8 (Lectura Compuesta)',
    level: 'Avanzado',
    timeSignature: '6/8',
    keySignature: 'Em',
    bpm: 70,
    genre: 'Rock Progresivo',
    subgenre: 'Lectura en 6/8',
    artist: 'Gary Turner & Tim Bogart',
    album: 'Rock Bass Basics',
    sourceLabel: 'Compás 6/8 · Dos pulsos ternarios por compás',
    pdfSourceId: 'pdf-progressive-bass',
    sightReadingTip: 'Cuenta dos grandes pulsos por compás (1-2-3, 4-5-6). Cada pulso equivale a una negra con puntillo.',
    notes: [
      { midi: 28, durationBeats: 0.5, chordSymbol: 'Em' },
      { midi: 35, durationBeats: 0.5 },
      { midi: 40, durationBeats: 0.5 },
      { midi: 43, durationBeats: 0.5 },
      { midi: 40, durationBeats: 0.5 },
      { midi: 35, durationBeats: 0.5 },
      { midi: 36, durationBeats: 0.5, chordSymbol: 'C' },
      { midi: 40, durationBeats: 0.5 },
      { midi: 43, durationBeats: 0.5 },
      { midi: 38, durationBeats: 0.5, chordSymbol: 'D' },
      { midi: 42, durationBeats: 0.5 },
      { midi: 45, durationBeats: 0.5 },
    ],
  },
  {
    id: 'sr-odd-meter-54',
    title: 'Estudio 6 · Lectura en 5/4 (Agrupación 3 + 2)',
    level: 'Maestro',
    timeSignature: '5/4',
    keySignature: 'Cm',
    bpm: 108,
    genre: 'Jazz',
    subgenre: 'Métrica Irregular 5/4',
    artist: 'Paul Desmond / Dave Brubeck Style',
    album: 'Curso Completo de Bajo Eléctrico',
    sourceLabel: 'Adrian Ashton · Compases irregulares 5/4',
    pdfSourceId: 'pdf-adrian-ashton',
    sightReadingTip: 'Siente el ostinato en 3 + 2: “UNO-dos-tres, CUATRO-cinco”. No pierdas el acento del tiempo 4.',
    notes: [
      { midi: 36, durationBeats: 1.5, chordSymbol: 'Cm7 (5/4)' },
      { midi: 43, durationBeats: 0.5 },
      { midi: 46, durationBeats: 1 },
      { midi: 43, durationBeats: 1 },
      { midi: 39, durationBeats: 1 },
      { midi: 34, durationBeats: 1.5, chordSymbol: 'Bb7' },
      { midi: 41, durationBeats: 0.5 },
      { midi: 44, durationBeats: 1 },
      { midi: 41, durationBeats: 1 },
      { midi: 38, durationBeats: 1 },
    ],
  },
];

const KEY_SCALES: Record<string, number[]> = {
  C: [24, 26, 28, 29, 31, 33, 35, 36, 38, 40, 41, 43, 45, 47, 48],
  G: [26, 28, 30, 31, 33, 35, 36, 38, 40, 42, 43, 45, 47, 48, 50],
  F: [28, 29, 31, 33, 34, 36, 38, 40, 41, 43, 45, 46, 48],
  Bb: [26, 27, 29, 31, 33, 34, 36, 38, 39, 41, 43, 45, 46],
  D: [26, 28, 30, 31, 33, 35, 37, 38, 40, 42, 43, 45, 47, 49, 50],
  Am: [28, 29, 31, 33, 35, 36, 38, 40, 41, 43, 45, 47, 48],
  Em: [28, 30, 31, 33, 35, 36, 38, 40, 42, 43, 45, 47, 48],
  Dm: [26, 28, 29, 31, 33, 34, 36, 38, 40, 41, 43, 45, 46],
};

/**
 * Generates a fresh sight-reading exercise in bass range (E1..G3) adhering strictly to the selected time signature, key, and difficulty.
 */
export function generateProceduralSightReading(options: {
  level: DifficultyLevel;
  keySignature: string;
  timeSignature: TimeSignature;
  bars?: number;
}): SightReadingEtude {
  const { level, keySignature, timeSignature, bars = 4 } = options;
  const rawPool = KEY_SCALES[keySignature] ?? KEY_SCALES.C;
  // Keep within ergonomic standard bass range (28 E1 .. 48 C3)
  const pool = rawPool.filter((m) => m >= 28 && m <= 48);

  const beatsPerBar = (() => {
    if (timeSignature === '3/4') return 3;
    if (timeSignature === '2/4') return 2;
    if (timeSignature === '5/4') return 5;
    if (timeSignature === '6/8') return 3; // 6 eighth notes = 3 quarter beats
    if (timeSignature === '12/8') return 6;
    if (timeSignature === '7/8') return 3.5;
    return 4;
  })();

  const rhythmPalette = (() => {
    if (level === 'Principiante') return [1, 1, 2];
    if (level === 'Intermedio') return [1, 0.5, 0.5, 1.5, 0.5];
    if (level === 'Avanzado') return [0.5, 0.5, 0.25, 0.25, 1, 1.5];
    return [0.25, 0.25, 0.5, 0.75, 0.25, 0.5, 1];
  })();

  const notes: NoteEvent[] = [];
  let prevIdx = Math.floor(pool.length / 3);

  for (let b = 0; b < bars; b++) {
    let remaining = beatsPerBar;
    let firstBeatInBar = true;

    while (remaining > 0.01) {
      let dur = rhythmPalette[Math.floor(Math.random() * rhythmPalette.length)];
      if (dur > remaining) {
        dur = remaining >= 1 ? 1 : remaining >= 0.5 ? 0.5 : 0.25;
      }
      if (dur > remaining) dur = remaining;

      // Occasional rests for intermediate+
      const allowRest = !firstBeatInBar && level !== 'Principiante' && Math.random() < 0.16 && dur <= 1;
      if (allowRest) {
        notes.push({ midi: pool[prevIdx], durationBeats: dur, isRest: true });
      } else {
        // Stepwise or small interval jump for realistic bass voice-leading
        const maxStep = level === 'Principiante' ? 2 : level === 'Intermedio' ? 3 : 5;
        const delta = Math.floor(Math.random() * (maxStep * 2 + 1)) - maxStep;
        const nextIdx = Math.max(0, Math.min(pool.length - 1, prevIdx + delta));
        prevIdx = nextIdx;
        const midi = firstBeatInBar && b === 0 ? pool[0] : pool[nextIdx];
        const pos = findBestStringAndFret(midi, TUNING_PRESETS[0]);
        notes.push({
          midi,
          durationBeats: dur,
          stringNum: pos.stringIndex + 1,
          fret: pos.fret,
          chordSymbol: firstBeatInBar ? keySignature : undefined,
        });
      }

      firstBeatInBar = false;
      remaining = Math.round((remaining - dur) * 100) / 100;
    }
  }

  return {
    id: `sr-gen-${Date.now()}`,
    title: `Lectura Aleatoria en ${keySignature} (${timeSignature})`,
    level,
    timeSignature,
    keySignature,
    bpm: level === 'Principiante' ? 76 : level === 'Intermedio' ? 92 : 108,
    genre: 'Lectura Musical',
    subgenre: 'Generador a Primera Vista',
    artist: 'Generador BajoMaestro',
    album: 'Práctica Infinita',
    sourceLabel: `Generado · Nivel ${level}`,
    pdfSourceId: 'pdf-adrian-ashton',
    sightReadingTip: 'Escanea primero la armadura, las figuras más rápidas y la nota más grave antes de pulsar Play.',
    notes,
  };
}
