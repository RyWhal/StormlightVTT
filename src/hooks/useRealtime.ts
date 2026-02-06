import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useMapStore } from '../stores/mapStore';
import { useChatStore } from '../stores/chatStore';
import { useInitiativeStore } from '../stores/initiativeStore';
import {
  dbSessionToSession,
  dbMapToMap,
  dbCharacterToCharacter,
  dbNPCInstanceToNPCInstance,
  dbSessionPlayerToSessionPlayer,
  dbChatMessageToChatMessage,
  dbDiceRollToDiceRoll,
  dbInitiativeEntryToInitiativeEntry,
  dbInitiativeRollLogToInitiativeRollLog,
  type DbSession,
  type DbMap,
  type DbCharacter,
  type DbNPCInstance,
  type DbSessionPlayer,
  type DbChatMessage,
  type DbDiceRoll,
  type DbInitiativeEntry,
  type DbInitiativeRollLog,
} from '../types';
import { clearTokenBroadcastChannel, getTokenBroadcastChannel } from '../lib/tokenBroadcast';

const isMissingRelationError = (error: { code?: string; message?: string } | null) =>
  error?.code === '42P01' || error?.message?.toLowerCase().includes('does not exist');

export const useRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initiativeChannelRef = useRef<RealtimeChannel | null>(null);
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
    moveCharacter,
    updateNPCInstance,
    addNPCInstance,
    removeNPCInstance,
    moveNPCInstance,
    setTokenLock,
    clearTokenLock,
  } = useMapStore();
  const { addMessage, addDiceRoll } = useChatStore();
  const { upsertEntry, removeEntry, addRollLog } = useInitiativeStore();

  useEffect(() => {
    if (!session?.id) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    const sessionId = session.id;
    let cancelled = false;

    const channel = supabase.channel(`session:${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUser?.username || 'anonymous' },
      },
    });

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

        if (updated.activeMapId !== session.activeMapId) {
          const activeMap = maps.find((m) => m.id === updated.activeMapId);
          setActiveMap(activeMap || null);
        }
      }
    );

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
        () => {
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
        if (roll.visibility === 'public') {
          addDiceRoll(roll);
        } else if (roll.visibility === 'gm_only' && currentUser?.isGm) {
          addDiceRoll(roll);
        } else if (roll.visibility === 'self' && roll.username === currentUser?.username) {
          addDiceRoll(roll);
        }
      }
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setConnectionStatus('reconnecting');
      }
    });

    channelRef.current = channel;
    const tokenChannel = getTokenBroadcastChannel(sessionId);
    const buildTokenKey = (type: 'character' | 'npc', id: string) => `${type}:${id}`;

    tokenChannel.on('broadcast', { event: 'token_move' }, ({ payload }) => {
      const movePayload = payload as {
        sessionId: string;
        tokenId: string;
        tokenType: 'character' | 'npc';
        x: number;
        y: number;
      };

      if (movePayload.sessionId !== sessionId) return;

      if (movePayload.tokenType === 'character') {
        moveCharacter(movePayload.tokenId, movePayload.x, movePayload.y);
      } else {
        moveNPCInstance(movePayload.tokenId, movePayload.x, movePayload.y);
      }
    });

    tokenChannel.on('broadcast', { event: 'token_lock' }, ({ payload }) => {
      const lockPayload = payload as {
        sessionId: string;
        tokenId: string;
        tokenType: 'character' | 'npc';
        username: string;
      };

      if (lockPayload.sessionId !== sessionId) return;
      setTokenLock(buildTokenKey(lockPayload.tokenType, lockPayload.tokenId), lockPayload.username);
    });

    tokenChannel.on('broadcast', { event: 'token_unlock' }, ({ payload }) => {
      const lockPayload = payload as {
        sessionId: string;
        tokenId: string;
        tokenType: 'character' | 'npc';
        username: string;
      };

      if (lockPayload.sessionId !== sessionId) return;
      clearTokenLock(buildTokenKey(lockPayload.tokenType, lockPayload.tokenId));
    });

    const connectInitiativeChannel = async () => {
      const { error: entriesError } = await supabase.from('initiative_entries').select('id').limit(1);
      if (isMissingRelationError(entriesError) || cancelled) {
        return;
      }

      const initiativeChannel = supabase.channel(`initiative:${sessionId}`);

      initiativeChannel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'initiative_entries',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            upsertEntry(dbInitiativeEntryToInitiativeEntry(payload.new as DbInitiativeEntry));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'initiative_entries',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            upsertEntry(dbInitiativeEntryToInitiativeEntry(payload.new as DbInitiativeEntry));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'initiative_entries',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            removeEntry((payload.old as { id: string }).id);
          }
        );

      const { error: logsError } = await supabase.from('initiative_roll_logs').select('id').limit(1);
      if (!isMissingRelationError(logsError)) {
        initiativeChannel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'initiative_roll_logs',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            addRollLog(dbInitiativeRollLogToInitiativeRollLog(payload.new as DbInitiativeRollLog));
          }
        );
      }

      initiativeChannel.subscribe();
      initiativeChannelRef.current = initiativeChannel;
    };

    void connectInitiativeChannel();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (initiativeChannelRef.current) {
        supabase.removeChannel(initiativeChannelRef.current);
        initiativeChannelRef.current = null;
      }
      clearTokenBroadcastChannel();
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
    moveCharacter,
    updateNPCInstance,
    addNPCInstance,
    removeNPCInstance,
    moveNPCInstance,
    setTokenLock,
    clearTokenLock,
    addMessage,
    addDiceRoll,
    upsertEntry,
    removeEntry,
    addRollLog,
    setConnectionStatus,
  ]);

  return {
    isConnected: useSessionStore((state) => state.connectionStatus === 'connected'),
  };
};
