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
  midi: number;
  durationBeats: number;
  isRest?: boolean;
  stringNum?: number;
  fret?: number;
  technique?: NoteTechniqueTag;
  tieToNext?: boolean;
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

export interface ShapePoint {
  /** 0 = E string (lowest in 4-string), 1 = A, 2 = D, 3 = G */
  stringFromBottom: number;
  /** Fret offset relative to the root anchor fret */
  fretOffset: number;
  /** Recommended left-hand finger: 1=Índice, 2=Medio, 3=Anular, 4=Meñique, 0=Al aire */
  finger: '0' | '1' | '2' | '3' | '4';
  interval: string;
  isRoot?: boolean;
  isBlueNote?: boolean;
}

export interface BoxShapeDef {
  id: string;
  name: string;
  description: string;
  /** Prefer root on E string (0) or A string (1) */
  anchorStringFromBottom: 0 | 1;
  points: ShapePoint[];
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
  blueNoteIndices?: number[];
  blueNoteExplanation?: string;
  shapes?: BoxShapeDef[];
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
  shapes?: BoxShapeDef[];
  genres: string[];
  artists: string[];
  albums: string[];
  bassApplication: string;
}

export interface TuningPreset {
  id: string;
  name: string;
  stringsCount: 4 | 5 | 6;
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
