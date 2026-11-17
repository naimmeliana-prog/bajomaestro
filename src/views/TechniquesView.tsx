import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Guitar,
  LayoutGrid,
  Maximize2,
  Search,
  Sparkles,
  X,
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
  const [showAtlasGrid, setShowAtlasGrid] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
    setShowAtlasGrid(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Técnicas, Diagramas de Postura y Estilos Progresivos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Diagramas vectoriales de postura correcta para cada técnica, guías anatómicas y demostraciones animadas paso a paso
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAtlasGrid((v) => !v)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
            showAtlasGrid
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          {showAtlasGrid
            ? 'Volver al detalle de técnica'
            : `Atlas Visual de Posturas (${TECHNIQUE_GUIDES.length})`}
        </button>
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
            placeholder="Buscar técnica (muteo, slap, staccato...)"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Optional Visual Posture Atlas Grid */}
      {showAtlasGrid ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuides.map((g) => {
            const broken = Boolean(brokenImages[g.id]);
            const isSelected = g.id === activeGuide.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelectGuide(g.id)}
                className={`text-left rounded-xl border overflow-hidden bg-white dark:bg-slate-900 transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-amber-500 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/70'
                }`}
              >
                <div className="aspect-[4/3] bg-slate-950 overflow-hidden relative">
                  {!broken ? (
                    <img
                      src={g.imageUrl}
                      alt={g.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenImages((prev) => ({ ...prev, [g.id]: true }))}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-400">
                      <Guitar className="w-8 h-8 text-amber-500 mb-2" />
                      <span className="text-xs font-semibold">{g.title}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    {g.category} · Nivel {g.level}
                  </div>
                  <div className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                    {g.title}
                  </div>
                  <div className="space-y-1 pt-1">
                    {g.diagramCallouts.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <span
                          className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            c.color === 'amber' ? 'bg-amber-500' : 'bg-sky-400'
                          }`}
                        />
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        /* Main Master-Detail Stage */
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
            {/* Hero Posture Diagram & Overview Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-6 bg-slate-950 relative flex flex-col justify-between overflow-hidden">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    {!isImageBroken ? (
                      <>
                        <img
                          src={activeGuide.imageUrl}
                          alt={activeGuide.imageAlt}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [activeGuide.id]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxOpen(true)}
                          title="Ampliar diagrama de postura"
                          className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700 text-[11px] font-semibold cursor-pointer backdrop-blur-sm"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                          Ampliar diagrama
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-amber-950/60 flex flex-col items-center justify-center p-6 text-center">
                        <Guitar className="w-10 h-10 text-amber-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-300">
                          {activeGuide.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Diagram Vector Key Legend */}
                  <div className="px-4 py-3 bg-slate-900/95 border-t border-slate-800 space-y-1.5">
                    {activeGuide.diagramCallouts.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <span
                          className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                            c.color === 'amber' ? 'bg-amber-500' : 'bg-sky-400'
                          }`}
                        />
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-6 p-5 flex flex-col justify-between gap-4">
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
                          Basado en:{' '}
                          <strong className="text-slate-700 dark:text-slate-200">{pdf.title}</strong>
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
                    <strong className="text-sky-700 dark:text-sky-400">
                      Acústico / Contrabajo:{' '}
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300">
                      {activeGuide.acousticNotes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Diagram Lightbox Modal */}
      {lightboxOpen && !isImageBroken && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-amber-400">{activeGuide.category}</div>
                <h3 className="font-display font-bold text-lg text-white">{activeGuide.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                aria-label="Cerrar vista ampliada"
                className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={activeGuide.imageUrl}
                alt={activeGuide.imageAlt}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeGuide.diagramCallouts.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <span
                    className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                      c.color === 'amber' ? 'bg-amber-500' : 'bg-sky-400'
                    }`}
                  />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
