import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useMapStore } from '../stores/mapStore';
import { useChatStore } from '../stores/chatStore';
import {
  dbSessionToSession,
  dbMapToMap,
  dbCharacterToCharacter,
  dbNPCInstanceToNPCInstance,
  dbSessionPlayerToSessionPlayer,
  dbChatMessageToChatMessage,
  dbDiceRollToDiceRoll,
  type DbSession,
  type DbMap,
  type DbCharacter,
  type DbNPCInstance,
  type DbSessionPlayer,
  type DbChatMessage,
  type DbDiceRoll,
} from '../types';

export const useRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { session, currentUser, updateSession, setPlayers, addPlayer, removePlayer, setConnectionStatus } =
    useSessionStore();
  const {
    maps,
    updateMap,
    addMap,
    removeMap,
    setActiveMap,
    updateCharacter,
    addCharacter,
    removeCharacter,
    updateNPCInstance,
    addNPCInstance,
    removeNPCInstance,
  } = useMapStore();
  const { addMessage, addDiceRoll } = useChatStore();

  useEffect(() => {
    if (!session?.id) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    const sessionId = session.id;

    // Create channel for this session
    const channel = supabase.channel(`session:${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUser?.username || 'anonymous' },
      },
    });

    // Session changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        const updated = dbSessionToSession(payload.new as DbSession);
        updateSession(updated);

        // If active map changed, update it
        if (updated.activeMapId !== session.activeMapId) {
          const activeMap = maps.find((m) => m.id === updated.activeMapId);
          setActiveMap(activeMap || null);
        }
      }
    );

    // Map changes
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maps',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          addMap(dbMapToMap(payload.new as DbMap));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maps',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = dbMapToMap(payload.new as DbMap);
          updateMap(updated.id, updated);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'maps',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          removeMap((payload.old as { id: string }).id);
        }
      );

    // Character changes
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'characters',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          addCharacter(dbCharacterToCharacter(payload.new as DbCharacter));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = dbCharacterToCharacter(payload.new as DbCharacter);
          updateCharacter(updated.id, updated);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'characters',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          removeCharacter((payload.old as { id: string }).id);
        }
      );

    // NPC Instance changes (we need to handle this differently since filter is by map_id)
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'npc_instances',
        },
        (payload) => {
          const instance = payload.new as DbNPCInstance;
          // Check if this NPC belongs to a map in our session
          if (maps.some((m) => m.id === instance.map_id)) {
            addNPCInstance(dbNPCInstanceToNPCInstance(instance));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'npc_instances',
        },
        (payload) => {
          const updated = dbNPCInstanceToNPCInstance(payload.new as DbNPCInstance);
          updateNPCInstance(updated.id, updated);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'npc_instances',
        },
        (payload) => {
          removeNPCInstance((payload.old as { id: string }).id);
        }
      );

    // Player changes
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          addPlayer(dbSessionPlayerToSessionPlayer(payload.new as DbSessionPlayer));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = dbSessionPlayerToSessionPlayer(payload.new as DbSessionPlayer);
          // Reload players to get accurate list
          supabase
            .from('session_players')
            .select('*')
            .eq('session_id', sessionId)
            .then(({ data }) => {
              if (data) {
                setPlayers((data as DbSessionPlayer[]).map(dbSessionPlayerToSessionPlayer));
              }
            });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'session_players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          removePlayer((payload.old as { id: string }).id);
        }
      );

    // Chat messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        addMessage(dbChatMessageToChatMessage(payload.new as DbChatMessage));
      }
    );

    // Dice rolls
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dice_rolls',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const roll = dbDiceRollToDiceRoll(payload.new as DbDiceRoll);
        // Filter based on visibility
        if (roll.visibility === 'public') {
          addDiceRoll(roll);
        } else if (roll.visibility === 'gm_only' && currentUser?.isGm) {
          addDiceRoll(roll);
        } else if (roll.visibility === 'self' && roll.username === currentUser?.username) {
          addDiceRoll(roll);
        }
      }
    );

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setConnectionStatus('reconnecting');
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    session?.id,
    currentUser?.username,
    currentUser?.isGm,
    maps,
    updateSession,
    setPlayers,
    addPlayer,
    removePlayer,
    updateMap,
    addMap,
    removeMap,
    setActiveMap,
    updateCharacter,
    addCharacter,
    removeCharacter,
    updateNPCInstance,
    addNPCInstance,
    removeNPCInstance,
    addMessage,
    addDiceRoll,
    setConnectionStatus,
  ]);

  return {
    isConnected: useSessionStore((state) => state.connectionStatus === 'connected'),
  };
};
