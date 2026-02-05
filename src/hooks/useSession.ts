import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateSessionCode } from '../lib/sessionCode';
import { useSessionStore } from '../stores/sessionStore';
import { useMapStore } from '../stores/mapStore';
import { useChatStore } from '../stores/chatStore';
import {
  dbSessionToSession,
  dbMapToMap,
  dbCharacterToCharacter,
  dbNPCTemplateToNPCTemplate,
  dbNPCInstanceToNPCInstance,
  dbSessionPlayerToSessionPlayer,
  dbChatMessageToChatMessage,
  dbDiceRollToDiceRoll,
  type DbSession,
  type DbMap,
  type DbCharacter,
  type DbNPCTemplate,
  type DbNPCInstance,
  type DbSessionPlayer,
  type DbChatMessage,
  type DbDiceRoll,
} from '../types';

export const useSession = () => {
  const {
    session,
    currentUser,
    setSession,
    updateSession,
    setCurrentUser,
    setPlayers,
    clearSession,
  } = useSessionStore();

  const {
    setMaps,
    setActiveMap,
    setCharacters,
    setNPCTemplates,
    setNPCInstances,
    clearMapState,
  } = useMapStore();

  const { setMessages, setDiceRolls, clearChatState } = useChatStore();

  /**
   * Create a new session
   */
  const createSession = useCallback(
    async (
      sessionName: string,
      username: string
    ): Promise<{ success: boolean; code?: string; error?: string }> => {
      try {
        // Generate unique code with collision check
        let code = generateSessionCode();
        let attempts = 0;
        while (attempts < 5) {
          const { data: existing } = await supabase
            .from('sessions')
            .select('id')
            .eq('code', code)
            .single();

          if (!existing) break;
          code = generateSessionCode();
          attempts++;
        }

        // Create session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            code,
            name: sessionName,
            current_gm_username: username,
          })
          .select()
          .single();

        if (sessionError || !sessionData) {
          return { success: false, error: sessionError?.message || 'Failed to create session' };
        }

        const newSession = dbSessionToSession(sessionData as DbSession);

        // Add creator as player with GM role
        const { error: playerError } = await supabase.from('session_players').insert({
          session_id: newSession.id,
          username,
          is_gm: true,
        });

        if (playerError) {
          // Cleanup session on error
          await supabase.from('sessions').delete().eq('id', newSession.id);
          return { success: false, error: playerError.message };
        }

        // Set local state
        setSession(newSession);
        setCurrentUser({ username, characterId: null, isGm: true });

        return { success: true, code };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [setSession, setCurrentUser]
  );

  /**
   * Join an existing session
   */
  const joinSession = useCallback(
    async (
      code: string,
      username: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Find session by code
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', code.toUpperCase())
          .single();

        if (sessionError || !sessionData) {
          return { success: false, error: 'Session not found' };
        }

        const joinedSession = dbSessionToSession(sessionData as DbSession);

        // Check if username is already taken
        const { data: existingPlayer } = await supabase
          .from('session_players')
          .select('id')
          .eq('session_id', joinedSession.id)
          .eq('username', username)
          .single();

        if (existingPlayer) {
          // Update last seen for reconnecting player
          await supabase
            .from('session_players')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', existingPlayer.id);
        } else {
          // Add new player
          const { error: playerError } = await supabase
            .from('session_players')
            .insert({
              session_id: joinedSession.id,
              username,
              is_gm: false,
            });

          if (playerError) {
            return { success: false, error: playerError.message };
          }
        }

        // Set local state
        setSession(joinedSession);
        const isGm = joinedSession.currentGmUsername === username;
        setCurrentUser({ username, characterId: null, isGm });

        // Load session data
        await loadSessionData(joinedSession.id);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [setSession, setCurrentUser]
  );

  /**
   * Load all session data (maps, characters, etc.)
   */
  const loadSessionData = useCallback(
    async (sessionId: string) => {
      try {
        // Load maps
        const { data: mapsData } = await supabase
          .from('maps')
          .select('*')
          .eq('session_id', sessionId)
          .order('sort_order', { ascending: true });

        if (mapsData) {
          const maps = (mapsData as DbMap[]).map(dbMapToMap);
          setMaps(maps);

          // Set active map if session has one
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('active_map_id')
            .eq('id', sessionId)
            .single();

          if (sessionData?.active_map_id) {
            const activeMap = maps.find((m) => m.id === sessionData.active_map_id);
            if (activeMap) setActiveMap(activeMap);
          }
        }

        // Load characters
        const { data: charactersData } = await supabase
          .from('characters')
          .select('*')
          .eq('session_id', sessionId);

        if (charactersData) {
          setCharacters((charactersData as DbCharacter[]).map(dbCharacterToCharacter));
        }

        // Load NPC templates
        const { data: templatesData } = await supabase
          .from('npc_templates')
          .select('*')
          .eq('session_id', sessionId);

        if (templatesData) {
          setNPCTemplates((templatesData as DbNPCTemplate[]).map(dbNPCTemplateToNPCTemplate));
        }

        // Load NPC instances for all maps
        const { data: instancesData } = await supabase
          .from('npc_instances')
          .select('*')
          .in(
            'map_id',
            mapsData?.map((m: DbMap) => m.id) || []
          );

        if (instancesData) {
          setNPCInstances((instancesData as DbNPCInstance[]).map(dbNPCInstanceToNPCInstance));
        }

        // Load players
        const { data: playersData } = await supabase
          .from('session_players')
          .select('*')
          .eq('session_id', sessionId);

        if (playersData) {
          setPlayers((playersData as DbSessionPlayer[]).map(dbSessionPlayerToSessionPlayer));
        }

        // Load chat messages (last 100)
        const { data: messagesData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (messagesData) {
          setMessages(
            (messagesData as DbChatMessage[])
              .map(dbChatMessageToChatMessage)
              .reverse()
          );
        }

        // Load dice rolls (last 50)
        const { data: rollsData } = await supabase
          .from('dice_rolls')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (rollsData) {
          setDiceRolls(
            (rollsData as DbDiceRoll[])
              .map(dbDiceRollToDiceRoll)
              .reverse()
          );
        }
      } catch (error) {
        console.error('Error loading session data:', error);
      }
    },
    [setMaps, setActiveMap, setCharacters, setNPCTemplates, setNPCInstances, setPlayers, setMessages, setDiceRolls]
  );

  /**
   * Claim GM role
   */
  const claimGM = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!session || !currentUser) {
      return { success: false, error: 'Not in a session' };
    }

    try {
      // Use conditional update to prevent race conditions
      const { data, error } = await supabase
        .from('sessions')
        .update({ current_gm_username: currentUser.username })
        .eq('id', session.id)
        .is('current_gm_username', null)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: 'Someone else claimed GM first' };
      }

      // Update player record
      await supabase
        .from('session_players')
        .update({ is_gm: true })
        .eq('session_id', session.id)
        .eq('username', currentUser.username);

      updateSession({ currentGmUsername: currentUser.username });
      setCurrentUser({ ...currentUser, isGm: true });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [session, currentUser, updateSession, setCurrentUser]);

  /**
   * Release GM role
   */
  const releaseGM = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!session || !currentUser) {
      return { success: false, error: 'Not in a session' };
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ current_gm_username: null })
        .eq('id', session.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update player record
      await supabase
        .from('session_players')
        .update({ is_gm: false })
        .eq('session_id', session.id)
        .eq('username', currentUser.username);

      updateSession({ currentGmUsername: null });
      setCurrentUser({ ...currentUser, isGm: false });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [session, currentUser, updateSession, setCurrentUser]);

  /**
   * Leave session
   */
  const leaveSession = useCallback(async () => {
    if (session && currentUser) {
      // Remove player from session
      await supabase
        .from('session_players')
        .delete()
        .eq('session_id', session.id)
        .eq('username', currentUser.username);

      // If GM, release the role
      if (currentUser.isGm) {
        await supabase
          .from('sessions')
          .update({ current_gm_username: null })
          .eq('id', session.id);
      }

      // Release any claimed characters
      await supabase
        .from('characters')
        .update({ is_claimed: false, claimed_by_username: null })
        .eq('session_id', session.id)
        .eq('claimed_by_username', currentUser.username);
    }

    // Clear local state
    clearSession();
    clearMapState();
    clearChatState();
  }, [session, currentUser, clearSession, clearMapState, clearChatState]);

  /**
   * Update notepad content
   */
  const updateNotepad = useCallback(
    async (content: string) => {
      if (!session) return;

      await supabase
        .from('sessions')
        .update({ notepad_content: content })
        .eq('id', session.id);

      updateSession({ notepadContent: content });
    },
    [session, updateSession]
  );

  return {
    session,
    currentUser,
    createSession,
    joinSession,
    loadSessionData,
    claimGM,
    releaseGM,
    leaveSession,
    updateNotepad,
  };
};
