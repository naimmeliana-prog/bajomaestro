import React, { useState } from 'react';
import { BookOpen, ExternalLink, FileText, X } from 'lucide-react';
import { PDF_RESOURCES } from '../data/pdfResources';

interface PdfLibraryModalProps {
  open: boolean;
  initialPdfId?: string;
  onClose: () => void;
}

export const PdfLibraryModal: React.FC<PdfLibraryModalProps> = ({ open, initialPdfId, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>(initialPdfId || PDF_RESOURCES[0].id);

  if (!open) return null;

  const activePdf = PDF_RESOURCES.find((p) => p.id === selectedId) || PDF_RESOURCES[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Biblioteca de Métodos PDF Adjuntos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                7 libros completos integrados en el plan de estudios · Consulta directa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar biblioteca PDF"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-50/70 dark:bg-slate-950/40">
            {PDF_RESOURCES.map((pdf) => {
              const selected = pdf.id === activePdf.id;
              return (
                <button
                  key={pdf.id}
                  type="button"
                  onClick={() => setSelectedId(pdf.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-white dark:bg-slate-900 border-amber-500/70 shadow-xs'
                      : 'bg-transparent border-slate-200/80 dark:border-slate-800 hover:bg-white/70 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        selected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                        {pdf.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {pdf.author} · {pdf.language} · {pdf.pagesOrTracks}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {pdf.focus}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 flex flex-col min-h-0 bg-slate-100 dark:bg-slate-950">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">{activePdf.title}</strong> ·{' '}
                {activePdf.genres.join(' · ')}
              </div>
              <a
                href={activePdf.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Abrir PDF en pestaña nueva
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <iframe
              src={activePdf.fileUrl}
              title={activePdf.title}
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
