import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminStore, isAdminSessionValid } from '../stores/adminStore';
import {
  dbSessionToSession,
  type DbSession,
  type Session,
  type SessionPlayer,
} from '../types';

export interface SessionWithDetails extends Session {
  playerCount: number;
  mapCount: number;
  characterCount: number;
  lastActivity: string;
}

export interface AdminLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface GlobalAsset {
  id: string;
  assetType: 'token' | 'map';
  name: string;
  description: string;
  imageUrl: string;
  defaultSize?: string;
  category?: string;
  width?: number;
  height?: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useAdmin = () => {
  const { isAuthenticated, setAuthenticated, updateActivity, logout } = useAdminStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Verify admin password
   */
  const login = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'admin_password')
          .single();

        if (error) {
          console.error('Admin login query error:', error);
          setIsLoading(false);
          return { success: false, error: `Database error: ${error.message}` };
        }

        if (!data) {
          setIsLoading(false);
          return { success: false, error: 'Admin password not configured in database' };
        }

        if (data.value === password) {
          setAuthenticated(true);

          // Log admin login
          await logAdminAction('admin_login', {});

          setIsLoading(false);
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: 'Invalid password' };
      } catch (error) {
        console.error('Admin login error:', error);
        setIsLoading(false);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [setAuthenticated]
  );

  /**
   * Change admin password
   */
  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isAdminSessionValid()) {
        return { success: false, error: 'Session expired' };
      }

      try {
        // Verify current password
        const { data: current } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'admin_password')
          .single();

        if (!current || current.value !== currentPassword) {
          return { success: false, error: 'Current password is incorrect' };
        }

        // Update password
        const { error } = await supabase
          .from('system_settings')
          .update({ value: newPassword })
          .eq('key', 'admin_password');

        if (error) {
          return { success: false, error: error.message };
        }

        await logAdminAction('password_changed', {});
        updateActivity();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [updateActivity]
  );

  /**
   * Get all sessions with details
   */
  const getSessions = useCallback(async (): Promise<SessionWithDetails[]> => {
    if (!isAdminSessionValid()) return [];

    updateActivity();

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!sessions) return [];

    // Get counts for each session
    const sessionsWithDetails: SessionWithDetails[] = await Promise.all(
      sessions.map(async (session: DbSession) => {
        const [players, maps, characters] = await Promise.all([
          supabase
            .from('session_players')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', session.id),
          supabase
            .from('maps')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', session.id),
          supabase
            .from('characters')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', session.id),
        ]);

        return {
          ...dbSessionToSession(session),
          playerCount: players.count || 0,
          mapCount: maps.count || 0,
          characterCount: characters.count || 0,
          lastActivity: session.updated_at,
        };
      })
    );

    return sessionsWithDetails;
  }, [updateActivity]);

  /**
   * Get session players
   */
  const getSessionPlayers = useCallback(
    async (sessionId: string): Promise<SessionPlayer[]> => {
      if (!isAdminSessionValid()) return [];

      updateActivity();

      const { data } = await supabase
        .from('session_players')
        .select('*')
        .eq('session_id', sessionId);

      return (data || []).map((p: any) => ({
        id: p.id,
        sessionId: p.session_id,
        username: p.username,
        characterId: p.character_id,
        isGm: p.is_gm,
        lastSeen: p.last_seen,
      }));
    },
    [updateActivity]
  );

  /**
   * Delete a session
   */
  const deleteSession = useCallback(
    async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
      if (!isAdminSessionValid()) {
        return { success: false, error: 'Session expired' };
      }

      try {
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('id', sessionId);

        if (error) {
          return { success: false, error: error.message };
        }

        await logAdminAction('session_deleted', { sessionId });
        updateActivity();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [updateActivity]
  );

  /**
   * Remove a player from session
   */
  const removePlayer = useCallback(
    async (
      sessionId: string,
      playerId: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isAdminSessionValid()) {
        return { success: false, error: 'Session expired' };
      }

      try {
        const { error } = await supabase
          .from('session_players')
          .delete()
          .eq('id', playerId);

        if (error) {
          return { success: false, error: error.message };
        }

        await logAdminAction('player_removed', { sessionId, playerId });
        updateActivity();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [updateActivity]
  );

  /**
   * Get admin logs
   */
  const getAdminLogs = useCallback(
    async (limit = 100): Promise<AdminLog[]> => {
      if (!isAdminSessionValid()) return [];

      updateActivity();

      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return (data || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ipAddress: log.ip_address,
        createdAt: log.created_at,
      }));
    },
    [updateActivity]
  );

  /**
   * Get global assets
   */
  const getGlobalAssets = useCallback(
    async (type?: 'token' | 'map'): Promise<GlobalAsset[]> => {
      if (!isAdminSessionValid()) return [];

      updateActivity();

      let query = supabase
        .from('global_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('asset_type', type);
      }

      const { data } = await query;

      return (data || []).map((asset: any) => ({
        id: asset.id,
        assetType: asset.asset_type,
        name: asset.name,
        description: asset.description,
        imageUrl: asset.image_url,
        defaultSize: asset.default_size,
        category: asset.category,
        width: asset.width,
        height: asset.height,
        tags: asset.tags || [],
        isActive: asset.is_active,
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
      }));
    },
    [updateActivity]
  );

  /**
   * Create global asset
   */
  const createGlobalAsset = useCallback(
    async (
      asset: Omit<GlobalAsset, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<{ success: boolean; asset?: GlobalAsset; error?: string }> => {
      if (!isAdminSessionValid()) {
        return { success: false, error: 'Session expired' };
      }

      try {
        const { data, error } = await supabase
          .from('global_assets')
          .insert({
            asset_type: asset.assetType,
            name: asset.name,
            description: asset.description,
            image_url: asset.imageUrl,
            default_size: asset.defaultSize,
            category: asset.category,
            width: asset.width,
            height: asset.height,
            tags: asset.tags,
            is_active: asset.isActive,
          })
          .select()
          .single();

        if (error || !data) {
          return { success: false, error: error?.message || 'Failed to create asset' };
        }

        await logAdminAction('asset_created', { assetId: data.id, name: asset.name });
        updateActivity();

        return {
          success: true,
          asset: {
            id: data.id,
            assetType: data.asset_type,
            name: data.name,
            description: data.description,
            imageUrl: data.image_url,
            defaultSize: data.default_size,
            category: data.category,
            width: data.width,
            height: data.height,
            tags: data.tags || [],
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [updateActivity]
  );

  /**
   * Delete global asset
   */
  const deleteGlobalAsset = useCallback(
    async (assetId: string): Promise<{ success: boolean; error?: string }> => {
      if (!isAdminSessionValid()) {
        return { success: false, error: 'Session expired' };
      }

      try {
        const { error } = await supabase
          .from('global_assets')
          .delete()
          .eq('id', assetId);

        if (error) {
          return { success: false, error: error.message };
        }

        await logAdminAction('asset_deleted', { assetId });
        updateActivity();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [updateActivity]
  );

  return {
    isAuthenticated: isAuthenticated && isAdminSessionValid(),
    isLoading,
    login,
    logout,
    changePassword,
    getSessions,
    getSessionPlayers,
    deleteSession,
    removePlayer,
    getAdminLogs,
    getGlobalAssets,
    createGlobalAsset,
    deleteGlobalAsset,
  };
};

// Helper to log admin actions
const logAdminAction = async (action: string, details: Record<string, unknown>) => {
  try {
    await supabase.from('admin_logs').insert({
      action,
      details,
    });
  } catch (e) {
    console.error('Failed to log admin action:', e);
  }
};
