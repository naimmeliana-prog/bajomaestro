import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Pause,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSync } from '../context/SyncContext';
import { PracticeCategory, PracticeItemRecord } from '../types/music';

const CATEGORY_LABELS: Record<PracticeCategory, string> = {
  technique: 'Técnica',
  theory: 'Teoría y Armonía',
  sight_reading: 'Lectura a 1ª Vista',
  repertoire: 'Repertorio / Groove',
  ear_training: 'Educación Auditiva',
};

export const PracticePlanView: React.FC = () => {
  const {
    user,
    syncStatus,
    syncErrorMsg,
    preferences,
    practiceItems,
    practiceLogs,
    signInWithGoogle,
    logout,
    updatePreferences,
    addPracticeItem,
    togglePracticeItem,
    deletePracticeItem,
    logPracticeSession,
  } = useSync();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PracticeCategory>('technique');
  const [targetBpm, setTargetBpm] = useState(90);
  const [durationMinutes, setDurationMinutes] = useState(15);

  // Active Block Timer
  const [activeTimerItem, setActiveTimerItem] = useState<PracticeItemRecord | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (activeTimerItem) {
            void logPracticeSession({
              durationMinutes: activeTimerItem.durationMinutes,
              bpm: activeTimerItem.targetBpm,
              focusArea: activeTimerItem.title,
              lessonId: activeTimerItem.lessonId,
              notes: 'Bloque completado con temporizador',
            });
            if (!activeTimerItem.completedToday) {
              void togglePracticeItem(activeTimerItem.id);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, secondsLeft, activeTimerItem, logPracticeSession, togglePracticeItem]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLoggedMinutes = useMemo(
    () =>
      practiceLogs
        .filter((l) => l.dateKey === todayKey)
        .reduce((sum, l) => sum + l.durationMinutes, 0),
    [practiceLogs, todayKey]
  );

  const completedRoutineMinutes = useMemo(
    () =>
      practiceItems
        .filter((i) => i.completedToday)
        .reduce((sum, i) => sum + i.durationMinutes, 0),
    [practiceItems]
  );

  const effectiveTodayMinutes = Math.max(todayLoggedMinutes, completedRoutineMinutes);
  const goalPct = Math.min(
    100,
    Math.round((effectiveTodayMinutes / Math.max(5, preferences.dailyGoalMinutes)) * 100)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    void addPracticeItem({
      title: title.trim(),
      category,
      targetBpm,
      durationMinutes,
    });
    setTitle('');
  };

  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Organizador de Prácticas Diarias y Sincronización
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Estructura tus bloques de estudio diarios, cronometra tus sesiones y guarda tu progreso en la nube
          </p>
        </div>
      </div>

      {/* Top Grid: Daily Goal Progress + Cloud Sync Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Objetivo Diario de Estudio
              </div>
              <div className="font-mono font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {effectiveTodayMinutes} / {preferences.dailyGoalMinutes} min ({goalPct}%)
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500 dark:text-slate-400">Meta diaria (min):</label>
              <select
                value={preferences.dailyGoalMinutes}
                onChange={(e) => void updatePreferences({ dailyGoalMinutes: Number(e.target.value) })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
              >
                {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-600 dark:bg-amber-500 transition-all"
              style={{ width: `${goalPct}%` }}
            />
          </div>

          {activeTimerItem && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800/70 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Cronómetro activo · {activeTimerItem.title}
                </div>
                <div className="font-mono font-extrabold text-2xl text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatMMSS(secondsLeft)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {timerRunning ? 'Pausar' : 'Reanudar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setActiveTimerItem(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cloud Sync Status & Account */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sincronización en la Nube
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                {user ? (
                  <>
                    <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {syncStatus === 'syncing' ? 'Sincronizando...' : 'Conectado en la nube'}
                    </span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Modo local</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {user
                ? `Sesión iniciada como ${user.displayName || user.email}. Tus lecciones, notas, rutinas y preferencias se respaldan automáticamente entre dispositivos.`
                : 'Inicia sesión con tu cuenta de Google para guardar tu progreso, rutinas y registros de estudio en la nube y acceder desde cualquier dispositivo.'}
            </p>
            {syncErrorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{syncErrorMsg}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <select
              value={preferences.instrumentType}
              onChange={(e) =>
                void updatePreferences({
                  instrumentType: e.target.value as 'electric' | 'acoustic' | 'both',
                })
              }
              aria-label="Instrumento principal"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            >
              <option value="both">Bajo Eléctrico y Acústico</option>
              <option value="electric">Solo Bajo Eléctrico</option>
              <option value="acoustic">Solo Bajo Acústico / Contrabajo</option>
            </select>

            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Conectar con Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Routine Organizer + Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-4">
          {/* Add Practice Block Form */}
          <form
            onSubmit={handleAdd}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-5 space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Nuevo bloque de práctica
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej.: Escala Dórica en G + Metrónomo"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Área
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PracticeCategory)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                BPM / Min
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min={30}
                  max={260}
                  value={targetBpm}
                  onChange={(e) => setTargetBpm(Number(e.target.value))}
                  aria-label="BPM objetivo"
                  className="w-1/2 px-2 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  aria-label="Duración en minutos"
                  className="w-1/2 px-2 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir
              </button>
            </div>
          </form>

          {/* Routine Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {practiceItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No tienes bloques en tu rutina todavía. Añade uno arriba o desde cualquier lección.
              </div>
            ) : (
              practiceItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => void togglePracticeItem(item.id)}
                    className="flex items-start gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    {item.completedToday ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold ${
                          item.completedToday
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                        {CATEGORY_LABELS[item.category]} · {item.targetBpm} BPM · {item.durationMinutes} min
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTimerItem(item);
                        setSecondsLeft(item.durationMinutes * 60);
                        setTimerRunning(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Cronometrar
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePracticeItem(item.id)}
                      aria-label="Eliminar bloque"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Session Logs */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
            Historial de Sesiones Completadas
          </h3>

          {practiceLogs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              Completa un bloque cronometrado o registra minutos desde una lección para ver tu historial aquí.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {practiceLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {log.focusArea}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {log.dateKey} · {log.bpm} BPM
                    </div>
                  </div>
                  <div className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                    +{log.durationMinutes} min
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
