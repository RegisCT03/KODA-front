'use client';

import { create } from 'zustand';
import {
  MOCK_SNIPPETS,
  getSnippetsByLanguage,
  type User,
  type Snippet,
  type LanguageSlug,
  type Difficulty,
  type SessionResult,
} from './mock-data';
import { login as apiLogin, logout as apiLogout, getCurrentUser, createSession } from './api';

interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  initAuth: () => void;
  loginMock: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface SessionSlice {
  currentSnippet: Snippet | null;
  activeLanguage: LanguageSlug;
  activeDifficulty: Difficulty;
  lastResult: SessionResult | null;
  setLanguage: (lang: LanguageSlug) => void;
  setDifficulty: (diff: Difficulty) => void;
  loadNewSnippet: () => void;
  saveResult: (result: SessionResult) => Promise<void>; 
}

interface UISlice {
  isResultModalOpen: boolean;
  openResultModal: () => void;
  closeResultModal: () => void;
}

type StoreState = AuthSlice & SessionSlice & UISlice;

export const useStore = create<StoreState>()((set, get) => ({
  user: null,
  isAuthenticated: false,

  initAuth: () => {
    // Restaura la sesión desde localStorage verificando que el token no haya expirado
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const storedUser = getCurrentUser()

    if (token && storedUser) {
      try {
        // Decodificar el payload del JWT sin verificar firma (solo para leer exp)
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp && Date.now() / 1000 > payload.exp

        if (isExpired) {
          // Token expirado — limpiar localStorage y no restaurar sesión
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          return
        }

        set({ user: storedUser as User, isAuthenticated: true })
      } catch {
        // Token malformado — limpiar
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },

  loginMock: async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiLogin({ email, password })
      const { user } = response.data

      set({
        user: user as User,
        isAuthenticated: true,
      })
      return true
    } catch {
      return false
    }
  },

  logout: () => {
    apiLogout()
    set({
      user: null,
      isAuthenticated: false,
    })
  },

  currentSnippet: null,
  activeLanguage: 'typescript',
  activeDifficulty: 'EASY',
  lastResult: null,

  setLanguage: (lang: LanguageSlug) => {
    set({ activeLanguage: lang });
  },

  setDifficulty: (diff: Difficulty) => {
    set({ activeDifficulty: diff });
  },

  loadNewSnippet: () => {
    const { activeLanguage, activeDifficulty } = get();

    const candidates = (getSnippetsByLanguage(activeLanguage)).filter(
      (s) => s.difficulty === activeDifficulty,
    );

    if (candidates.length === 0) {
      set({ currentSnippet: null });
      return;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    set({ currentSnippet: candidates[randomIndex] });
  },

 saveResult: async (result: SessionResult) => {
    set({ lastResult: result });
    const { currentSnippet, isAuthenticated } = get();
    if (currentSnippet && isAuthenticated) {
      try {
        const timeMs = (result as any).timeMs || 60000;
        const durationMs = Math.max(1000, timeMs);
        const estimatedCorrectChars = Math.round(result.wpm * 5 * (durationMs / 60000));
        const correctChars = (result as any).correctChars || estimatedCorrectChars;
        const payload = {
          snippetId:    currentSnippet.id,
          wpm:          result.wpm,
          accuracy:     result.precision,   // precision es 0-100
          correctChars: correctChars,
          totalErrors:  (result as any).mistakes || result.totalErrors || 0,
          durationMs:   durationMs,
          keyErrors:    result.difficultKeys || [],
        };
        await createSession(payload);
      } catch (error) {
        console.error("Error al guardar en el backend:", error);
      }
    }
  },

  isResultModalOpen: false,

  openResultModal: () => {
    set({ isResultModalOpen: true });
  },

  closeResultModal: () => {
    set({ isResultModalOpen: false });
  },
}));

export const useUser = () => useStore((s) => s.user);

export const useSession = () =>
  useStore((s) => ({
    snippet: s.currentSnippet,
    lang: s.activeLanguage,
    diff: s.activeDifficulty,
  }));

export const useLastResult = () => useStore((s) => s.lastResult);