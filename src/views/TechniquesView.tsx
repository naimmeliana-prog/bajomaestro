import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Guitar,
  Search,
  Sparkles,
} from 'lucide-react';
import { NotationDisplay } from '../components/NotationDisplay';
import { TechniqueAnimator } from '../components/TechniqueAnimator';
import { getPdfById } from '../data/pdfResources';
import { TECHNIQUE_GUIDES, TechniqueCategory } from '../data/techniques';

interface TechniquesViewProps {
  onOpenPdf: (pdfId: string) => void;
}

const CATEGORIES: ('Todas' | TechniqueCategory)[] = [
  'Todas',
  'Mano Derecha',
  'Mano Izquierda',
  'Estilos y Grooves',
  'Acústico y Fretless',
];

export const TechniquesView: React.FC<TechniquesViewProps> = ({ onOpenPdf }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'Todas' | TechniqueCategory>('Todas');
  const [selectedId, setSelectedId] = useState(TECHNIQUE_GUIDES[0].id);
  const [stepIdx, setStepIdx] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TECHNIQUE_GUIDES.filter((g) => {
      if (category !== 'Todas' && g.category !== category) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  const activeGuide =
    filteredGuides.find((g) => g.id === selectedId) || filteredGuides[0] || TECHNIQUE_GUIDES[0];

  const activeStep = activeGuide.steps[Math.min(stepIdx, activeGuide.steps.length - 1)];
  const pdf = getPdfById(activeGuide.pdfSourceId);
  const isImageBroken = Boolean(brokenImages[activeGuide.id]);

  const handleSelectGuide = (id: string) => {
    setSelectedId(id);
    setStepIdx(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Técnicas y Estilos Progresivos (Paso a Paso)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Guías anatómicas, ilustraciones de estudio y demostraciones animadas para dominar el bajo eléctrico y acústico
          </p>
        </div>
      </div>

      {/* Category & Search Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar técnica o estilo (slap, cumbia, muteo...)"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main Master-Detail Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <aside className="lg:col-span-4 space-y-2.5">
          {filteredGuides.map((g) => {
            const isSelected = g.id === activeGuide.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelectGuide(g.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {g.category}
                  </span>
                  <span>
                    {g.level} · {g.steps.length} pasos
                  </span>
                </div>
                <div className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  {g.title}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {g.summary}
                </p>
              </button>
            );
          })}

          {filteredGuides.length === 0 && (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
              No hay técnicas que coincidan con tu búsqueda.
            </div>
          )}
        </aside>

        {/* Right Detail Stage */}
        <section className="lg:col-span-8 space-y-5">
          {/* Hero Illustration & Overview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 bg-slate-900 relative min-h-[220px] flex items-center justify-center overflow-hidden">
                {!isImageBroken ? (
                  <img
                    src={activeGuide.imageUrl}
                    alt={activeGuide.imageAlt}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [activeGuide.id]: true }))
                    }
                    className="w-full h-full object-cover min-h-[220px]"
                  />
                ) : (
                  <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-slate-800 via-slate-900 to-amber-950/60 flex flex-col items-center justify-center p-6 text-center">
                    <Guitar className="w-10 h-10 text-amber-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-300">
                      {activeGuide.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-7 p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {activeGuide.category} · Nivel {activeGuide.level}
                  </div>
                  <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 mt-1">
                    {activeGuide.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                    {activeGuide.summary}
                  </p>
                </div>

                {pdf && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        Basado en: <strong className="text-slate-700 dark:text-slate-200">{pdf.title}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPdf(pdf.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-500 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      Abrir PDF de referencia
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Animated Video-Style Demonstration */}
          <TechniqueAnimator preset={activeGuide.animatorPreset} step={activeStep} />

          {/* Progressive Steps Selector & Practical Notation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Progresión Práctica ({activeGuide.steps.length} Fases)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Haz clic en cada fase para entrenar paso a paso
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {activeGuide.steps.map((s, idx) => {
                const isSelected = idx === stepIdx;
                return (
                  <button
                    key={s.stepNumber}
                    type="button"
                    onClick={() => setStepIdx(idx)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                    }`}
                  >
                    <div className="text-[11px] font-mono font-bold uppercase opacity-80">
                      Fase {s.stepNumber} · {s.bpm} BPM
                    </div>
                    <div className="text-xs font-bold mt-0.5 line-clamp-2">{s.title}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-slate-100">{activeStep.title}:</strong>{' '}
              {activeStep.explanation}
            </div>

            <NotationDisplay
              notes={activeStep.notes}
              timeSignature={activeStep.timeSignature}
              keySignature={activeStep.keySignature}
              initialBpm={activeStep.bpm}
              defaultToneMode={activeStep.toneMode}
            />
          </div>

          {/* Anatomy Points, Common Mistakes & Electric/Acoustic Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Claves Anatómicas y Mecánica
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeGuide.anatomyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      0{i + 1}.
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="space-y-2.5">
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Errores Comunes a Evitar
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeGuide.commonMistakes.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">×</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div>
                  <strong className="text-amber-700 dark:text-amber-400">Bajo Eléctrico: </strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    {activeGuide.electricNotes}
                  </span>
                </div>
                <div>
                  <strong className="text-sky-700 dark:text-sky-400">Acústico / Contrabajo: </strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    {activeGuide.acousticNotes}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
