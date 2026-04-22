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
    const storedUser = getCurrentUser()
    if (storedUser) {
      set({
        user: storedUser as User,
        isAuthenticated: true,
      })
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
        await createSession({
          snippetId: currentSnippet.id,
          wpm: result.wpm,
          accuracy: result.precision,
          mistakes: (result as any).mistakes || 0,
          timeMs: (result as any).timeMs || 0
        });
      } catch (error) {
        console.error("Error al guardar la sesión en el backend:", error);
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