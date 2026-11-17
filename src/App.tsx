/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarCheck,
  Cloud,
  Disc3,
  Eye,
  FileText,
  Guitar,
  Layers,
  LogIn,
  Moon,
  Sun,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PdfLibraryModal } from './components/PdfLibraryModal';
import { SyncProvider, useSync } from './context/SyncContext';
import { TheorySelectionProvider } from './context/TheorySelectionContext';
import { LabView } from './views/LabView';
import { LibraryView } from './views/LibraryView';
import { MethodView } from './views/MethodView';
import { PracticePlanView } from './views/PracticePlanView';
import { RepertoireView } from './views/RepertoireView';
import { SightReadingView } from './views/SightReadingView';
import { TechniquesView } from './views/TechniquesView';

type AppTab = 'method' | 'techniques' | 'sight_reading' | 'repertoire' | 'library' | 'lab' | 'practice';

const NAV_TABS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'method', label: 'Método', icon: BookOpen },
  { id: 'techniques', label: 'Técnicas', icon: Guitar },
  { id: 'sight_reading', label: 'Lectura', icon: Eye },
  { id: 'repertoire', label: 'Repertorio', icon: Disc3 },
  { id: 'library', label: 'Biblioteca', icon: Layers },
  { id: 'lab', label: 'Laboratorio', icon: Activity },
  { id: 'practice', label: 'Práctica', icon: CalendarCheck },
];

const AppShell: React.FC = () => {
  const { user, preferences, toggleTheme, signInWithGoogle } = useSync();
  const [activeTab, setActiveTab] = useState<AppTab>('method');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [activePdfId, setActivePdfId] = useState<string | undefined>(undefined);

  const handleOpenPdf = (pdfId: string) => {
    setActivePdfId(pdfId);
    setPdfModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('method')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <img
              src="/favicon.svg"
              alt="BajoMaestro"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">
              BajoMaestro
            </span>
          </button>

          {/* Zone 2: Single-line Primary Navigation */}
          <nav
            aria-label="Secciones principales"
            className="hidden md:flex items-center gap-1 overflow-x-auto"
          >
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-600/12 text-amber-700 dark:text-amber-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (PDFs, Theme, Cloud Sync CTA) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActivePdfId(undefined);
                setPdfModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>PDFs</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={preferences.theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {preferences.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{user.displayName?.split(' ')[0] || 'Nube'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sincronizar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Bottom/Sub Navigation */}
        <nav
          aria-label="Navegación móvil"
          className="flex md:hidden items-center gap-1 px-3 py-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto"
        >
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'method' && <MethodView onOpenPdf={handleOpenPdf} />}
        {activeTab === 'techniques' && <TechniquesView onOpenPdf={handleOpenPdf} />}
        {activeTab === 'sight_reading' && <SightReadingView onOpenPdf={handleOpenPdf} />}
        {activeTab === 'repertoire' && <RepertoireView onOpenPdf={handleOpenPdf} />}
        {activeTab === 'library' && <LibraryView onOpenLab={() => setActiveTab('lab')} />}
        {activeTab === 'lab' && <LabView onOpenLibrary={() => setActiveTab('library')} />}
        {activeTab === 'practice' && <PracticePlanView />}
      </main>

      <PdfLibraryModal
        open={pdfModalOpen}
        initialPdfId={activePdfId}
        onClose={() => setPdfModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SyncProvider>
        <TheorySelectionProvider>
          <AppShell />
        </TheorySelectionProvider>
      </SyncProvider>
    </ErrorBoundary>
  );
}
