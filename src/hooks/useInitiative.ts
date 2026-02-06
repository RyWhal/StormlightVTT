import { useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useMapStore } from '../stores/mapStore';
import { useInitiativeStore } from '../stores/initiativeStore';
import {
  dbInitiativeEntryToInitiativeEntry,
  type DbInitiativeEntry,
  type InitiativePhase,
  type InitiativeVisibility,
} from '../types';

export const useInitiative = () => {
  const session = useSessionStore((state) => state.session);
  const currentUser = useSessionStore((state) => state.currentUser);
  const players = useSessionStore((state) => state.players);
  const characters = useMapStore((state) => state.characters);
  const activeMap = useMapStore((state) => state.activeMap);
  const npcInstances = useMapStore((state) => state.npcInstances);
  const entries = useInitiativeStore((state) => state.entries);

  const visibleEntries = useMemo(() => {
    if (currentUser?.isGm) return entries;
    return entries.filter((entry) => entry.visibility === 'public');
  }, [entries, currentUser?.isGm]);

  const setMyModifier = useCallback(
    async (modifier: number) => {
      if (!session || !currentUser) return { success: false, error: 'No session' };

      const player = players.find((p) => p.username === currentUser.username);
      if (!player) return { success: false, error: 'Player not found' };

      const { error } = await supabase
        .from('session_players')
        .update({ initiative_modifier: modifier })
        .eq('id', player.id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [session, currentUser, players]
  );

  const addPlayerInitiative = useCallback(
    async (phase: InitiativePhase, visibility: InitiativeVisibility) => {
      if (!session || !currentUser) return { success: false, error: 'No session' };

      const player = players.find((p) => p.username === currentUser.username);
      const modifier = player?.initiativeModifier ?? 0;
      const rollValue = Math.floor(Math.random() * 20) + 1;
      const total = rollValue + modifier;

      const myCharacter = characters.find((c) => c.claimedByUsername === currentUser.username);
      const sourceName = myCharacter?.name || currentUser.username;

      const { error } = await supabase.from('initiative_entries').insert({
        session_id: session.id,
        source_type: 'player',
        source_id: myCharacter?.id || null,
        source_name: sourceName,
        rolled_by_username: currentUser.username,
        modifier,
        roll_value: rollValue,
        total,
        phase,
        visibility,
      });

      if (error) return { success: false, error: error.message };
      return { success: true, rollValue, total };
    },
    [session, currentUser, players, characters]
  );

  const addNpcInitiative = useCallback(
    async (
      npcIds: string[],
      phase: InitiativePhase,
      visibility: InitiativeVisibility,
      modifier: number
    ) => {
      if (!session || !currentUser?.isGm) return { success: false, error: 'GM only' };

      const rows = npcIds
        .map((id) => npcInstances.find((npc) => npc.id === id))
        .filter(Boolean)
        .map((npc) => {
          const rollValue = Math.floor(Math.random() * 20) + 1;
          const total = rollValue + modifier;
          return {
            session_id: session.id,
            source_type: 'npc' as const,
            source_id: npc!.id,
            source_name: npc!.displayName || 'NPC',
            rolled_by_username: currentUser.username,
            modifier,
            roll_value: rollValue,
            total,
            phase,
            visibility,
          };
        });

      if (rows.length === 0) return { success: false, error: 'No NPCs selected' };
      const { error } = await supabase.from('initiative_entries').insert(rows);
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [session, currentUser, npcInstances]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<{ total: number; phase: InitiativePhase; visibility: InitiativeVisibility }>) => {
      if (!currentUser?.isGm) return { success: false, error: 'GM only' };
      const dbUpdates: Record<string, unknown> = { is_manual_override: true };
      if (updates.total !== undefined) dbUpdates.total = updates.total;
      if (updates.phase !== undefined) dbUpdates.phase = updates.phase;
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;

      const { error } = await supabase.from('initiative_entries').update(dbUpdates).eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [currentUser?.isGm]
  );

  const clearTracker = useCallback(async () => {
    if (!session || !currentUser?.isGm) return { success: false, error: 'GM only' };
    const { error } = await supabase.from('initiative_entries').delete().eq('session_id', session.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, [session, currentUser?.isGm]);

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!currentUser?.isGm) return { success: false, error: 'GM only' };
      const { error } = await supabase.from('initiative_entries').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [currentUser?.isGm]
  );

  const currentMapNpcs = useMemo(() => {
    if (!activeMap) return [];
    return npcInstances.filter((npc) => npc.mapId === activeMap.id);
  }, [npcInstances, activeMap]);

  const hydrateEntries = useCallback((rows: DbInitiativeEntry[]) => {
    useInitiativeStore.getState().setEntries(rows.map(dbInitiativeEntryToInitiativeEntry));
  }, []);

  return {
    entries: visibleEntries,
    allEntries: entries,
    currentMapNpcs,
    setMyModifier,
    addPlayerInitiative,
    addNpcInitiative,
    updateEntry,
    deleteEntry,
    clearTracker,
    hydrateEntries,
  };
};
