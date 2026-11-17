import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  Circle,
  FileText,
  Guitar,
  Headphones,
  Plus,
  Save,
} from 'lucide-react';
import { NotationDisplay } from '../components/NotationDisplay';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { useSync } from '../context/SyncContext';
import { CURRICULUM_LESSONS } from '../data/curriculum';
import { getPdfById } from '../data/pdfResources';
import { DifficultyLevel, Lesson } from '../types/music';

interface MethodViewProps {
  onOpenPdf: (pdfId: string) => void;
}

export const MethodView: React.FC<MethodViewProps> = ({ onOpenPdf }) => {
  const { lessonProgress, saveLessonProgress, addPracticeItem, logPracticeSession } = useSync();

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [level, setLevel] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(CURRICULUM_LESSONS[0].id);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const genres = useMemo(
    () => Array.from(new Set(CURRICULUM_LESSONS.map((l) => l.genre))).sort(),
    []
  );
  const artists = useMemo(
    () => Array.from(new Set(CURRICULUM_LESSONS.flatMap((l) => l.artists))).sort(),
    []
  );
  const albums = useMemo(
    () => Array.from(new Set(CURRICULUM_LESSONS.flatMap((l) => l.albums))).sort(),
    []
  );
  const levels: DifficultyLevel[] = ['Principiante', 'Intermedio', 'Avanzado', 'Maestro'];

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURRICULUM_LESSONS.filter((l) => {
      if (genre && l.genre !== genre) return false;
      if (artist && !l.artists.includes(artist)) return false;
      if (album && !l.albums.includes(album)) return false;
      if (level && l.level !== level) return false;
      if (!q) return true;
      const haystack = [
        l.title,
        l.subtitle,
        l.moduleTitle,
        l.genre,
        l.subgenre,
        l.summary,
        ...l.artists,
        ...l.albums,
        ...l.bassists,
        ...l.techniques,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, genre, artist, album, level]);

  const activeLesson: Lesson =
    filteredLessons.find((l) => l.id === selectedLessonId) ||
    filteredLessons[0] ||
    CURRICULUM_LESSONS[0];

  const activeProgress = lessonProgress[activeLesson.id] ?? {
    lessonId: activeLesson.id,
    completed: false,
    masteryPercent: 0,
    bestBpm: activeLesson.recommendedBpm,
    practiceMinutes: 0,
    notes: '',
    updatedAtIso: '',
  };

  const [draftNotes, setDraftNotes] = useState<string>(activeProgress.notes);
  React.useEffect(() => {
    setDraftNotes(activeProgress.notes);
  }, [activeLesson.id, activeProgress.notes]);

  const completedCount = useMemo(
    () => CURRICULUM_LESSONS.filter((l) => lessonProgress[l.id]?.completed).length,
    [lessonProgress]
  );

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => setFeedbackMsg(null), 2600);
  };

  const pdfSource = getPdfById(activeLesson.pdfSourceId);

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Método Progresivo Integral
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            6 módulos progresivos para bajo eléctrico y acústico · Técnica, teoría, lectura y todos los géneros
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Progreso global
            <div className="font-mono font-bold text-base text-slate-900 dark:text-slate-100 tabular-nums">
              {completedCount} / {CURRICULUM_LESSONS.length} lecciones
            </div>
          </div>
          <div className="w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-600 dark:bg-amber-500 transition-all"
              style={{
                width: `${Math.round((completedCount / CURRICULUM_LESSONS.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Multi-Facet Search & Filter */}
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        genre={genre}
        onGenreChange={setGenre}
        genres={genres}
        artist={artist}
        onArtistChange={setArtist}
        artists={artists}
        album={album}
        onAlbumChange={setAlbum}
        albums={albums}
        level={level}
        onLevelChange={setLevel}
        levels={levels}
        totalCount={CURRICULUM_LESSONS.length}
        filteredCount={filteredLessons.length}
        onReset={() => {
          setQuery('');
          setGenre('');
          setArtist('');
          setAlbum('');
          setLevel('');
        }}
      />

      {feedbackMsg && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          {feedbackMsg}
        </div>
      )}

      {/* Main 2-Zone Curriculum Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar: Lesson List */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[78vh] overflow-y-auto">
          {filteredLessons.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No hay lecciones que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLessons.map((lesson) => {
                const prog = lessonProgress[lesson.id];
                const isSelected = lesson.id === activeLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/25'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {prog?.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <Circle
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Módulo {lesson.moduleOrder} · {lesson.level} · {lesson.genre}
                        </div>
                        <div
                          className={`text-sm font-semibold leading-snug ${
                            isSelected
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {lesson.title}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{lesson.instrumentScope} · {lesson.recommendedBpm} BPM</span>
                          {prog && prog.masteryPercent > 0 && (
                            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                              {prog.masteryPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Stage: Active Lesson */}
        <section className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            {/* Metadata Header (Zero-pill discipline) */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {activeLesson.moduleTitle} · Lección {activeLesson.lessonOrder}
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {activeLesson.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {activeLesson.subtitle}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 tabular-nums">
                  {activeLesson.level} · {activeLesson.genre} ({activeLesson.subgenre}) ·{' '}
                  {activeLesson.instrumentScope} · Tonalidad {activeLesson.keySignature} ·{' '}
                  {activeLesson.timeSignature} · {activeLesson.recommendedBpm} BPM
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextCompleted = !activeProgress.completed;
                    void saveLessonProgress(activeLesson.id, {
                      completed: nextCompleted,
                      masteryPercent: nextCompleted ? Math.max(85, activeProgress.masteryPercent) : activeProgress.masteryPercent,
                    });
                    showToast(
                      nextCompleted
                        ? 'Lección marcada como completada y sincronizada.'
                        : 'Lección marcada como pendiente.'
                    );
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    activeProgress.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {activeProgress.completed ? 'Completada' : 'Marcar completada'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void addPracticeItem({
                      title: activeLesson.title,
                      category: activeLesson.genre === 'Lectura Musical' ? 'sight_reading' : 'technique',
                      targetBpm: activeLesson.recommendedBpm,
                      durationMinutes: activeLesson.durationMinutes,
                      lessonId: activeLesson.id,
                    });
                    showToast('Añadida a tu rutina diaria de práctica.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Añadir a práctica
                </button>
              </div>
            </div>

            {/* Summary & Theory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Objetivo de la lección
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeLesson.summary}
                </p>
              </div>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Concepto Teórico Clave
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeLesson.theoryConcept}
                </p>
              </div>
            </div>

            {/* Electric vs Acoustic Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  <Guitar className="w-4 h-4" />
                  Enfoque Bajo Eléctrico
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeLesson.electricTip}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <Headphones className="w-4 h-4" />
                  Enfoque Bajo Acústico / Contrabajo
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeLesson.acousticTip}
                </p>
              </div>
            </div>

            {/* Artists, Albums & PDF Source */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div className="space-y-0.5">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Artistas / Álbumes:</strong>{' '}
                  {activeLesson.artists.join(', ')} · {activeLesson.albums.join(', ')}
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Referencia PDF:</strong>{' '}
                  {activeLesson.pdfRefNote}
                </div>
              </div>
              {pdfSource && (
                <button
                  type="button"
                  onClick={() => onOpenPdf(pdfSource.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ver libro PDF ({pdfSource.author.split(' ')[0]})
                </button>
              )}
            </div>
          </div>

          {/* Interactive Exercise Notation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Ejercicio Práctico Interactivo
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Haz clic en cualquier nota para escucharla
              </span>
            </div>

            <NotationDisplay
              notes={activeLesson.exerciseNotes}
              timeSignature={activeLesson.timeSignature}
              keySignature={activeLesson.keySignature}
              initialBpm={activeLesson.recommendedBpm}
              defaultToneMode={
                activeLesson.instrumentScope === 'Acústico' ? 'acoustic_upright' : 'electric_finger'
              }
              onBpmAchieved={(achievedBpm) => {
                if (achievedBpm > activeProgress.bestBpm) {
                  void saveLessonProgress(activeLesson.id, { bestBpm: achievedBpm });
                }
              }}
            />
          </div>

          {/* Checklist + Personal Progress Tracking */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
                Objetivos de Dominio
              </h3>
              <ul className="space-y-2">
                {activeLesson.practiceChecklist.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
                  Seguimiento de Lección
                </h3>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Mejor tempo: {activeProgress.bestBpm} BPM · {activeProgress.practiceMinutes} min
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Nivel de dominio actual</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {activeProgress.masteryPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={activeProgress.masteryPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    void saveLessonProgress(activeLesson.id, {
                      masteryPercent: val,
                      completed: val >= 90 ? true : activeProgress.completed,
                    });
                  }}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Notas de estudio (digitación, fallos a pulir)
                </label>
                <textarea
                  rows={2}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Ej.: Limpiar salto de cuerda E a D en 110 BPM..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void saveLessonProgress(activeLesson.id, { notes: draftNotes });
                      showToast('Notas guardadas.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar notas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const mins = activeLesson.durationMinutes;
                      void saveLessonProgress(activeLesson.id, {
                        practiceMinutes: activeProgress.practiceMinutes + mins,
                      });
                      void logPracticeSession({
                        durationMinutes: mins,
                        bpm: activeProgress.bestBpm,
                        focusArea: activeLesson.title,
                        lessonId: activeLesson.id,
                        notes: 'Sesión registrada desde lección',
                      });
                      showToast(`+${mins} minutos registrados en tu historial.`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar +{activeLesson.durationMinutes} min
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
