import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type TokenMovePayload = {
  sessionId: string;
  tokenId: string;
  tokenType: 'character' | 'npc';
  x: number;
  y: number;
};

export type TokenLockPayload = {
  sessionId: string;
  tokenId: string;
  tokenType: 'character' | 'npc';
  username: string;
};

let tokenChannel: RealtimeChannel | null = null;
let activeSessionId: string | null = null;
let tokenChannelReady: Promise<void> | null = null;

export const getTokenBroadcastChannel = (sessionId: string) => {
  if (!tokenChannel || activeSessionId !== sessionId) {
    if (tokenChannel) {
      supabase.removeChannel(tokenChannel);
    }

    tokenChannel = supabase.channel(`token-moves:${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    tokenChannelReady = new Promise((resolve) => {
      tokenChannel?.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          resolve();
        }
      });
    });
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
  tokenChannelReady = null;
};

const ensureTokenBroadcastReady = async (sessionId: string) => {
  getTokenBroadcastChannel(sessionId);
  if (tokenChannelReady) {
    await tokenChannelReady;
  }
};

export const broadcastTokenMove = async (payload: TokenMovePayload) => {
  await ensureTokenBroadcastReady(payload.sessionId);
  const channel = getTokenBroadcastChannel(payload.sessionId);
  await channel.send({
    type: 'broadcast',
    event: 'token_move',
    payload,
  });
};

export const broadcastTokenLock = async (payload: TokenLockPayload) => {
  await ensureTokenBroadcastReady(payload.sessionId);
  const channel = getTokenBroadcastChannel(payload.sessionId);
  await channel.send({
    type: 'broadcast',
    event: 'token_lock',
    payload,
  });
};

export const broadcastTokenUnlock = async (payload: TokenLockPayload) => {
  await ensureTokenBroadcastReady(payload.sessionId);
  const channel = getTokenBroadcastChannel(payload.sessionId);
  await channel.send({
    type: 'broadcast',
    event: 'token_unlock',
    payload,
  });
};
