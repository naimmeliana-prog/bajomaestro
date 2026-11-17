import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  LessonProgressRecord,
  PracticeCategory,
  PracticeItemRecord,
  PracticeSessionLogRecord,
  UserPreferences,
} from '../types/music';

const LOCAL_PREFS_KEY = 'bajomaestro_prefs_v1';
const LOCAL_PROGRESS_KEY = 'bajomaestro_progress_v1';
const LOCAL_PRACTICE_KEY = 'bajomaestro_practice_v1';
const LOCAL_LOGS_KEY = 'bajomaestro_logs_v1';

const DEFAULT_PREFS: UserPreferences = {
  theme: 'dark',
  preferredTuning: '4-standard',
  instrumentType: 'both',
  dailyGoalMinutes: 30,
};

const DEFAULT_PRACTICE_ITEMS: PracticeItemRecord[] = [
  {
    id: 'default-fitness-1',
    title: 'Calentamiento Cromático 1-2-3-4 (Bass Fitness)',
    category: 'technique',
    targetBpm: 80,
    durationMinutes: 10,
    completedToday: false,
    lessonId: 'm2-l1',
    order: 0,
    updatedAtIso: new Date().toISOString(),
  },
  {
    id: 'default-sight-1',
    title: 'Lectura a Primera Vista en Clave de Fa (4/4)',
    category: 'sight_reading',
    targetBpm: 72,
    durationMinutes: 10,
    completedToday: false,
    lessonId: 'm1-l5',
    order: 1,
    updatedAtIso: new Date().toISOString(),
  },
  {
    id: 'default-groove-1',
    title: 'Blues de 12 Compases & Walking Turnaround',
    category: 'repertoire',
    targetBpm: 96,
    durationMinutes: 15,
    completedToday: false,
    lessonId: 'm3-l1',
    order: 2,
    updatedAtIso: new Date().toISOString(),
  },
];

interface SyncContextValue {
  user: User | null;
  authReady: boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
  syncErrorMsg: string | null;
  preferences: UserPreferences;
  lessonProgress: Record<string, LessonProgressRecord>;
  practiceItems: PracticeItemRecord[];
  practiceLogs: PracticeSessionLogRecord[];
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  toggleTheme: () => void;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  saveLessonProgress: (
    lessonId: string,
    patch: Partial<Omit<LessonProgressRecord, 'lessonId' | 'updatedAtIso'>>
  ) => Promise<void>;
  addPracticeItem: (item: {
    title: string;
    category: PracticeCategory;
    targetBpm: number;
    durationMinutes: number;
    lessonId?: string;
  }) => Promise<void>;
  togglePracticeItem: (itemId: string) => Promise<void>;
  deletePracticeItem: (itemId: string) => Promise<void>;
  logPracticeSession: (entry: {
    durationMinutes: number;
    bpm: number;
    focusArea: string;
    lessonId?: string;
    notes?: string;
  }) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clampInt(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return cleaned || `id_${Date.now()}`;
}

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    safeReadJson<UserPreferences>(LOCAL_PREFS_KEY, DEFAULT_PREFS)
  );
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgressRecord>>(() =>
    safeReadJson<Record<string, LessonProgressRecord>>(LOCAL_PROGRESS_KEY, {})
  );
  const [practiceItems, setPracticeItems] = useState<PracticeItemRecord[]>(() =>
    safeReadJson<PracticeItemRecord[]>(LOCAL_PRACTICE_KEY, DEFAULT_PRACTICE_ITEMS)
  );
  const [practiceLogs, setPracticeLogs] = useState<PracticeSessionLogRecord[]>(() =>
    safeReadJson<PracticeSessionLogRecord[]>(LOCAL_LOGS_KEY, [])
  );

  const profileEnsuredRef = useRef<string | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(preferences));
    } catch {
      // ignore storage quota errors
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(lessonProgress));
    } catch {
      // ignore
    }
  }, [lessonProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_PRACTICE_KEY, JSON.stringify(practiceItems));
    } catch {
      // ignore
    }
  }, [practiceItems]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(practiceLogs));
    } catch {
      // ignore
    }
  }, [practiceLogs]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      setAuthReady(true);
      if (!fbUser) {
        profileEnsuredRef.current = null;
        setSyncStatus('local');
      }
    });
    return () => unsub();
  }, []);

  // Ensure parent UserProfile document exists & subscribe to Firestore collections when signed in
  useEffect(() => {
    if (!authReady || !user) return;

    const uid = user.uid;
    let active = true;
    const unsubs: (() => void)[] = [];

    const initAndSubscribe = async () => {
      setSyncStatus('syncing');
      setSyncErrorMsg(null);
      const userDocRef = doc(db, 'users', uid);

      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const safeDisplayName = (user.displayName || 'Bajista').slice(0, 100);
          const safeEmail = (user.email || 'usuario@bajomaestro.app').slice(0, 160);
          await setDoc(userDocRef, {
            uid,
            displayName: safeDisplayName,
            email: safeEmail,
            theme: preferences.theme,
            preferredTuning: preferences.preferredTuning.slice(0, 32),
            instrumentType: preferences.instrumentType,
            dailyGoalMinutes: clampInt(preferences.dailyGoalMinutes, 5, 240),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        profileEnsuredRef.current = uid;
      } catch (err) {
        if (!active) return;
        setSyncStatus('error');
        setSyncErrorMsg('No se pudo inicializar el perfil en la nube.');
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }

      if (!active) return;

      // Subscribe to User Profile
      unsubs.push(
        onSnapshot(
          userDocRef,
          (snapshot) => {
            if (!snapshot.exists()) return;
            const d = snapshot.data();
            setPreferences({
              theme: d.theme === 'light' ? 'light' : 'dark',
              preferredTuning: typeof d.preferredTuning === 'string' ? d.preferredTuning : '4-standard',
              instrumentType:
                d.instrumentType === 'electric' || d.instrumentType === 'acoustic'
                  ? d.instrumentType
                  : 'both',
              dailyGoalMinutes: typeof d.dailyGoalMinutes === 'number' ? d.dailyGoalMinutes : 30,
            });
            setSyncStatus('synced');
          },
          (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
        )
      );

      // Subscribe to Lesson Progress
      const progressPath = `users/${uid}/lessonProgress`;
      unsubs.push(
        onSnapshot(
          collection(db, progressPath),
          (snapshot) => {
            const remoteMap: Record<string, LessonProgressRecord> = {};
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              remoteMap[docSnap.id] = {
                lessonId: docSnap.id,
                completed: Boolean(d.completed),
                masteryPercent: typeof d.masteryPercent === 'number' ? d.masteryPercent : 0,
                bestBpm: typeof d.bestBpm === 'number' ? d.bestBpm : 80,
                practiceMinutes: typeof d.practiceMinutes === 'number' ? d.practiceMinutes : 0,
                notes: typeof d.notes === 'string' ? d.notes : '',
                updatedAtIso: new Date().toISOString(),
              };
            });
            setLessonProgress((prev) => ({ ...prev, ...remoteMap }));
            setSyncStatus('synced');
          },
          (error) => handleFirestoreError(error, OperationType.LIST, progressPath)
        )
      );

      // Subscribe to Practice Items
      const itemsPath = `users/${uid}/practiceItems`;
      unsubs.push(
        onSnapshot(
          query(collection(db, itemsPath), orderBy('order', 'asc')),
          (snapshot) => {
            if (snapshot.empty) return;
            const list: PracticeItemRecord[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              list.push({
                id: docSnap.id,
                title: String(d.title || ''),
                category: d.category as PracticeCategory,
                targetBpm: Number(d.targetBpm || 80),
                durationMinutes: Number(d.durationMinutes || 10),
                completedToday: Boolean(d.completedToday),
                lessonId: String(d.lessonId || ''),
                order: Number(d.order || 0),
                updatedAtIso: new Date().toISOString(),
              });
            });
            setPracticeItems(list);
            setSyncStatus('synced');
          },
          (error) => handleFirestoreError(error, OperationType.LIST, itemsPath)
        )
      );

      // Subscribe to Practice Logs
      const logsPath = `users/${uid}/practiceLogs`;
      unsubs.push(
        onSnapshot(
          query(collection(db, logsPath), orderBy('createdAt', 'desc')),
          (snapshot) => {
            const logs: PracticeSessionLogRecord[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              logs.push({
                id: docSnap.id,
                dateKey: String(d.dateKey || ''),
                durationMinutes: Number(d.durationMinutes || 5),
                bpm: Number(d.bpm || 80),
                focusArea: String(d.focusArea || ''),
                lessonId: String(d.lessonId || ''),
                notes: String(d.notes || ''),
                createdAtIso: new Date().toISOString(),
              });
            });
            setPracticeLogs(logs);
            setSyncStatus('synced');
          },
          (error) => handleFirestoreError(error, OperationType.LIST, logsPath)
        )
      );
    };

    void initAndSubscribe();

    return () => {
      active = false;
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setSyncErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err);
      setSyncErrorMsg('No se pudo completar el acceso con Google. Verifica ventanas emergentes.');
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setSyncStatus('local');
  }, []);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const next: UserPreferences = {
        ...preferences,
        ...patch,
        dailyGoalMinutes: clampInt(patch.dailyGoalMinutes ?? preferences.dailyGoalMinutes, 5, 240),
        preferredTuning: (patch.preferredTuning ?? preferences.preferredTuning).slice(0, 32),
      };
      setPreferences(next);

      if (user) {
        const path = `users/${user.uid}`;
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            theme: next.theme,
            preferredTuning: next.preferredTuning,
            instrumentType: next.instrumentType,
            dailyGoalMinutes: next.dailyGoalMinutes,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    },
    [preferences, user]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    void updatePreferences({ theme: nextTheme });
  }, [preferences.theme, updatePreferences]);

  const saveLessonProgress = useCallback(
    async (
      lessonId: string,
      patch: Partial<Omit<LessonProgressRecord, 'lessonId' | 'updatedAtIso'>>
    ) => {
      const cleanId = sanitizeId(lessonId);
      const current = lessonProgress[cleanId] ?? {
        lessonId: cleanId,
        completed: false,
        masteryPercent: 0,
        bestBpm: 80,
        practiceMinutes: 0,
        notes: '',
        updatedAtIso: new Date().toISOString(),
      };

      const next: LessonProgressRecord = {
        lessonId: cleanId,
        completed: patch.completed ?? current.completed,
        masteryPercent: clampInt(patch.masteryPercent ?? current.masteryPercent, 0, 100),
        bestBpm: clampInt(patch.bestBpm ?? current.bestBpm, 20, 300),
        practiceMinutes: clampInt(patch.practiceMinutes ?? current.practiceMinutes, 0, 100000),
        notes: (patch.notes ?? current.notes).slice(0, 1000),
        updatedAtIso: new Date().toISOString(),
      };

      setLessonProgress((prev) => ({ ...prev, [cleanId]: next }));

      if (user) {
        const path = `users/${user.uid}/lessonProgress/${cleanId}`;
        const docRef = doc(db, 'users', user.uid, 'lessonProgress', cleanId);
        try {
          const snap = await getDoc(docRef);
          if (!snap.exists()) {
            await setDoc(docRef, {
              userId: user.uid,
              lessonId: cleanId,
              completed: next.completed,
              masteryPercent: next.masteryPercent,
              bestBpm: next.bestBpm,
              practiceMinutes: next.practiceMinutes,
              notes: next.notes,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(docRef, {
              completed: next.completed,
              masteryPercent: next.masteryPercent,
              bestBpm: next.bestBpm,
              practiceMinutes: next.practiceMinutes,
              notes: next.notes,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    },
    [lessonProgress, user]
  );

  const addPracticeItem = useCallback(
    async (item: {
      title: string;
      category: PracticeCategory;
      targetBpm: number;
      durationMinutes: number;
      lessonId?: string;
    }) => {
      const id = sanitizeId(`item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const nextOrder = clampInt(practiceItems.length, 0, 500);
      const record: PracticeItemRecord = {
        id,
        title: item.title.trim().slice(0, 120) || 'Bloque de estudio',
        category: item.category,
        targetBpm: clampInt(item.targetBpm, 30, 260),
        durationMinutes: clampInt(item.durationMinutes, 1, 180),
        completedToday: false,
        lessonId: sanitizeId(item.lessonId || ''),
        order: nextOrder,
        updatedAtIso: new Date().toISOString(),
      };
      if (!item.lessonId) record.lessonId = '';

      setPracticeItems((prev) => [...prev, record]);

      if (user) {
        const path = `users/${user.uid}/practiceItems/${id}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'practiceItems', id), {
            userId: user.uid,
            title: record.title,
            category: record.category,
            targetBpm: record.targetBpm,
            durationMinutes: record.durationMinutes,
            completedToday: record.completedToday,
            lessonId: record.lessonId,
            order: record.order,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
    },
    [practiceItems.length, user]
  );

  const togglePracticeItem = useCallback(
    async (itemId: string) => {
      const cleanId = sanitizeId(itemId);
      const target = practiceItems.find((i) => i.id === cleanId);
      if (!target) return;
      const nextVal = !target.completedToday;

      setPracticeItems((prev) =>
        prev.map((i) => (i.id === cleanId ? { ...i, completedToday: nextVal } : i))
      );

      if (user) {
        const path = `users/${user.uid}/practiceItems/${cleanId}`;
        const docRef = doc(db, 'users', user.uid, 'practiceItems', cleanId);
        try {
          const snap = await getDoc(docRef);
          if (!snap.exists()) {
            await setDoc(docRef, {
              userId: user.uid,
              title: target.title.slice(0, 120),
              category: target.category,
              targetBpm: clampInt(target.targetBpm, 30, 260),
              durationMinutes: clampInt(target.durationMinutes, 1, 180),
              completedToday: nextVal,
              lessonId: target.lessonId.slice(0, 80),
              order: clampInt(target.order, 0, 500),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(docRef, {
              completedToday: nextVal,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    },
    [practiceItems, user]
  );

  const deletePracticeItem = useCallback(
    async (itemId: string) => {
      const cleanId = sanitizeId(itemId);
      setPracticeItems((prev) => prev.filter((i) => i.id !== cleanId));
      if (user) {
        const path = `users/${user.uid}/practiceItems/${cleanId}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'practiceItems', cleanId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
      }
    },
    [user]
  );

  const logPracticeSession = useCallback(
    async (entry: {
      durationMinutes: number;
      bpm: number;
      focusArea: string;
      lessonId?: string;
      notes?: string;
    }) => {
      const id = sanitizeId(`log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const dateKey = new Date().toISOString().slice(0, 10);
      const record: PracticeSessionLogRecord = {
        id,
        dateKey,
        durationMinutes: clampInt(entry.durationMinutes, 1, 480),
        bpm: clampInt(entry.bpm, 20, 300),
        focusArea: entry.focusArea.trim().slice(0, 80) || 'Práctica libre',
        lessonId: entry.lessonId ? sanitizeId(entry.lessonId) : '',
        notes: (entry.notes || '').trim().slice(0, 500),
        createdAtIso: new Date().toISOString(),
      };

      setPracticeLogs((prev) => [record, ...prev]);

      if (user) {
        const path = `users/${user.uid}/practiceLogs/${id}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'practiceLogs', id), {
            userId: user.uid,
            dateKey: record.dateKey,
            durationMinutes: record.durationMinutes,
            bpm: record.bpm,
            focusArea: record.focusArea,
            lessonId: record.lessonId,
            notes: record.notes,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
    },
    [user]
  );

  return (
    <SyncContext.Provider
      value={{
        user,
        authReady,
        syncStatus,
        syncErrorMsg,
        preferences,
        lessonProgress,
        practiceItems,
        practiceLogs,
        signInWithGoogle,
        logout,
        toggleTheme,
        updatePreferences,
        saveLessonProgress,
        addPracticeItem,
        togglePracticeItem,
        deletePracticeItem,
        logPracticeSession,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync debe usarse dentro de SyncProvider.');
  return ctx;
}
