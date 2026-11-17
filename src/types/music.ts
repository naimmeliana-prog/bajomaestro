export type InstrumentScope = 'Eléctrico' | 'Acústico' | 'Ambos';
export type DifficultyLevel = 'Principiante' | 'Intermedio' | 'Avanzado' | 'Maestro';
export type TimeSignature = '4/4' | '3/4' | '2/4' | '6/8' | '12/8' | '5/4' | '7/8' | '7/4';
export type BassTechnique =
  | 'Dedos (Fingerstyle)'
  | 'Púa (Pick)'
  | 'Slap & Pop'
  | 'Notas Fantasma'
  | 'Walking Bass'
  | 'Hammer-On / Pull-Off'
  | 'Slide / Ligados'
  | 'Tapping'
  | 'Armónicos'
  | 'Double-Stops'
  | 'Fretless / Arco'
  | 'Lectura Rítmica';

export type NoteTechniqueTag =
  | 'normal'
  | 'ghost'
  | 'slap'
  | 'pop'
  | 'hammer'
  | 'pull'
  | 'slide'
  | 'harmonic'
  | 'tap'
  | 'staccato'
  | 'accent';

export interface NoteEvent {
  /** MIDI note number (e.g., E1 = 28, A1 = 33, D2 = 38, G2 = 43). Ignored if isRest is true. */
  midi: number;
  /** Duration in quarter-note beats (1 = quarter, 0.5 = 8th, 0.25 = 16th, 2 = half, 4 = whole, 1.5 = dotted quarter, 0.333 = triplet 8th) */
  durationBeats: number;
  /** True if this event is a rest */
  isRest?: boolean;
  /** Optional explicit string index (0 = lowest/thickest string, or 1..4 from G..E; we use 1=G, 2=D, 3=A, 4=E, 5=B) */
  stringNum?: number;
  /** Optional explicit fret override */
  fret?: number;
  /** Articulation / technique tag */
  technique?: NoteTechniqueTag;
  /** Optional tie from previous note */
  tieToNext?: boolean;
  /** Optional chord symbol above this beat */
  chordSymbol?: string;
}

export interface PdfResource {
  id: string;
  title: string;
  author: string;
  language: 'Español' | 'Inglés';
  fileUrl: string;
  focus: string;
  pagesOrTracks: string;
  genres: string[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  moduleOrder: number;
  moduleTitle: string;
  lessonOrder: number;
  title: string;
  subtitle: string;
  level: DifficultyLevel;
  instrumentScope: InstrumentScope;
  genre: string;
  subgenre: string;
  artists: string[];
  albums: string[];
  bassists: string[];
  techniques: BassTechnique[];
  keySignature: string;
  timeSignature: TimeSignature;
  recommendedBpm: number;
  durationMinutes: number;
  pdfSourceId: string;
  pdfRefNote: string;
  summary: string;
  theoryConcept: string;
  electricTip: string;
  acousticTip: string;
  practiceChecklist: string[];
  exerciseNotes: NoteEvent[];
}

export interface SightReadingEtude {
  id: string;
  title: string;
  level: DifficultyLevel;
  timeSignature: TimeSignature;
  keySignature: string;
  bpm: number;
  genre: string;
  subgenre: string;
  artist: string;
  album: string;
  sourceLabel: string;
  pdfSourceId: string;
  sightReadingTip: string;
  notes: NoteEvent[];
}

export interface RepertoireTrack {
  id: string;
  title: string;
  genre: string;
  subgenre: string;
  artist: string;
  album: string;
  bassist: string;
  year: number;
  key: string;
  timeSignature: TimeSignature;
  tempo: number;
  level: DifficultyLevel;
  instrumentScope: InstrumentScope;
  techniques: BassTechnique[];
  pdfSourceId: string;
  toneNotes: string;
  harmonicAnalysis: string;
  bassline: NoteEvent[];
}

export interface ScaleOrModeDef {
  id: string;
  nameEs: string;
  nameIntl: string;
  category: 'Escala Mayor y Menor' | 'Modos Griegos' | 'Pentatónicas y Blues' | 'Escalas Alteradas y Exóticas';
  semitones: number[];
  intervals: string[];
  formula: string;
  characteristicNote: string;
  genres: string[];
  artists: string[];
  albums: string[];
  usageTip: string;
}

export interface ChordDef {
  id: string;
  symbolSuffix: string;
  nameEs: string;
  category: 'Tríadas' | 'Séptimas' | 'Extendidos y Alterados' | 'Suspendidos e Inversiones';
  semitones: number[];
  intervals: string[];
  formula: string;
  genres: string[];
  artists: string[];
  albums: string[];
  bassApplication: string;
}

export interface TuningPreset {
  id: string;
  name: string;
  stringsCount: 4 | 5 | 6;
  /** Ordered highest pitch to lowest pitch (top string in TAB to bottom string in TAB, e.g. G2, D2, A1, E1) */
  strings: {
    label: string;
    noteEs: string;
    midi: number;
    hz: number;
  }[];
  description: string;
}

export interface LessonProgressRecord {
  lessonId: string;
  completed: boolean;
  masteryPercent: number;
  bestBpm: number;
  practiceMinutes: number;
  notes: string;
  updatedAtIso: string;
}

export type PracticeCategory = 'technique' | 'theory' | 'sight_reading' | 'repertoire' | 'ear_training';

export interface PracticeItemRecord {
  id: string;
  title: string;
  category: PracticeCategory;
  targetBpm: number;
  durationMinutes: number;
  completedToday: boolean;
  lessonId: string;
  order: number;
  updatedAtIso: string;
}

export interface PracticeSessionLogRecord {
  id: string;
  dateKey: string;
  durationMinutes: number;
  bpm: number;
  focusArea: string;
  lessonId: string;
  notes: string;
  createdAtIso: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  preferredTuning: string;
  instrumentType: 'electric' | 'acoustic' | 'both';
  dailyGoalMinutes: number;
}
