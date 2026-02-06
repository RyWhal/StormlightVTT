import { create } from 'zustand';
import type { InitiativeEntry } from '../types';

interface InitiativeState {
  entries: InitiativeEntry[];
  setEntries: (entries: InitiativeEntry[]) => void;
  upsertEntry: (entry: InitiativeEntry) => void;
  removeEntry: (id: string) => void;
  clearInitiativeState: () => void;
}

const sortEntries = (entries: InitiativeEntry[]) =>
  [...entries].sort((a, b) => {
    if (a.phase !== b.phase) return a.phase === 'fast' ? -1 : 1;
    const aTotal = a.total ?? -999;
    const bTotal = b.total ?? -999;
    if (aTotal !== bTotal) return bTotal - aTotal;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

export const useInitiativeStore = create<InitiativeState>()((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries: sortEntries(entries) }),
  upsertEntry: (entry) =>
    set((state) => ({
      entries: sortEntries([
        ...state.entries.filter((existing) => existing.id !== entry.id),
        entry,
      ]),
    })),
  removeEntry: (id) =>
    set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) })),
  clearInitiativeState: () => set({ entries: [] }),
}));
