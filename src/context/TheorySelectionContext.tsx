import React, { createContext, useContext, useMemo, useState } from 'react';
import { CHORDS_LIBRARY, SCALES_AND_MODES } from '../data/theoryLibrary';
import { BassToneMode } from '../utils/audioEngine';

export type LibraryTab = 'scales' | 'chords';

interface TheorySelectionContextValue {
  libraryTab: LibraryTab;
  setLibraryTab: (tab: LibraryTab) => void;
  rootPc: number;
  setRootPc: (pc: number) => void;
  tuningId: string;
  setTuningId: (id: string) => void;
  selectedScaleId: string;
  setSelectedScaleId: (id: string) => void;
  selectedChordId: string;
  setSelectedChordId: (id: string) => void;
  fretboardMode: 'shape' | 'full';
  setFretboardMode: (mode: 'shape' | 'full') => void;
  selectedShapeIdx: number;
  setSelectedShapeIdx: (idx: number) => void;
  toneMode: BassToneMode;
  setToneMode: (mode: BassToneMode) => void;
}

const TheorySelectionContext = createContext<TheorySelectionContextValue | null>(null);

export const TheorySelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('scales');
  const [rootPc, setRootPc] = useState<number>(4); // E default
  const [tuningId, setTuningId] = useState<string>('4-standard');
  const [selectedScaleId, setSelectedScaleId] = useState<string>(SCALES_AND_MODES[0].id);
  const [selectedChordId, setSelectedChordId] = useState<string>(CHORDS_LIBRARY[0].id);
  const [fretboardMode, setFretboardMode] = useState<'shape' | 'full'>('shape');
  const [selectedShapeIdx, setSelectedShapeIdx] = useState<number>(0);
  const [toneMode, setToneMode] = useState<BassToneMode>('electric_finger');

  const handleSetLibraryTab = (tab: LibraryTab) => {
    setLibraryTab(tab);
    setSelectedShapeIdx(0);
  };

  const handleSetSelectedScaleId = (id: string) => {
    setSelectedScaleId(id);
    setSelectedShapeIdx(0);
  };

  const handleSetSelectedChordId = (id: string) => {
    setSelectedChordId(id);
    setSelectedShapeIdx(0);
  };

  const value = useMemo<TheorySelectionContextValue>(
    () => ({
      libraryTab,
      setLibraryTab: handleSetLibraryTab,
      rootPc,
      setRootPc,
      tuningId,
      setTuningId,
      selectedScaleId,
      setSelectedScaleId: handleSetSelectedScaleId,
      selectedChordId,
      setSelectedChordId: handleSetSelectedChordId,
      fretboardMode,
      setFretboardMode,
      selectedShapeIdx,
      setSelectedShapeIdx,
      toneMode,
      setToneMode,
    }),
    [
      libraryTab,
      rootPc,
      tuningId,
      selectedScaleId,
      selectedChordId,
      fretboardMode,
      selectedShapeIdx,
      toneMode,
    ]
  );

  return (
    <TheorySelectionContext.Provider value={value}>
      {children}
    </TheorySelectionContext.Provider>
  );
};

export function useTheorySelection(): TheorySelectionContextValue {
  const ctx = useContext(TheorySelectionContext);
  if (!ctx) {
    throw new Error('useTheorySelection debe usarse dentro de TheorySelectionProvider');
  }
  return ctx;
}
