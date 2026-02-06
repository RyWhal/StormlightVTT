import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type TokenMovePayload = {
  sessionId: string;
  tokenId: string;
  tokenType: 'character' | 'npc';
  x: number;
  y: number;
};

let tokenChannel: RealtimeChannel | null = null;
let activeSessionId: string | null = null;

export const getTokenBroadcastChannel = (sessionId: string) => {
  if (!tokenChannel || activeSessionId !== sessionId) {
    if (tokenChannel) {
      supabase.removeChannel(tokenChannel);
    }

    tokenChannel = supabase.channel(`token-moves:${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    tokenChannel.subscribe();
    activeSessionId = sessionId;
  }

  return tokenChannel;
};

export const clearTokenBroadcastChannel = () => {
  if (tokenChannel) {
    supabase.removeChannel(tokenChannel);
  }
  tokenChannel = null;
  activeSessionId = null;
};

export const broadcastTokenMove = async (payload: TokenMovePayload) => {
  const channel = getTokenBroadcastChannel(payload.sessionId);
  await channel.send({
    type: 'broadcast',
    event: 'token_move',
    payload,
  });
};
