import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useMapStore } from '../stores/mapStore';
import {
  dbMapFolderToMapFolder,
  dbTokenFolderToTokenFolder,
  type DbMapFolder,
  type DbTokenFolder,
  type MapFolder,
  type TokenFolder,
} from '../types';

type FolderType = 'map' | 'token';

export const useFolders = (type: FolderType) => {
  const session = useSessionStore((state) => state.session);
  const {
    mapFolders,
    tokenFolders,
    addMapFolder,
    updateMapFolder,
    removeMapFolder,
    addTokenFolder,
    updateTokenFolder,
    removeTokenFolder,
  } = useMapStore();

  const folders = type === 'map' ? mapFolders : tokenFolders;

  const createFolder = useCallback(
    async (name: string): Promise<{ success: boolean; folder?: MapFolder | TokenFolder; error?: string }> => {
      if (!session) {
        return { success: false, error: 'Not in a session' };
      }

      try {
        const { data, error } = await supabase
          .from(type === 'map' ? 'map_folders' : 'token_folders')
          .insert({
            session_id: session.id,
            name,
            sort_order: folders.length,
          })
          .select()
          .single();

        if (error || !data) {
          return { success: false, error: error?.message || 'Failed to create folder' };
        }

        if (type === 'map') {
          const folder = dbMapFolderToMapFolder(data as DbMapFolder);
          addMapFolder(folder);
          return { success: true, folder };
        }

        const folder = dbTokenFolderToTokenFolder(data as DbTokenFolder);
        addTokenFolder(folder);
        return { success: true, folder };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [session, type, folders.length, addMapFolder, addTokenFolder]
  );

  const renameFolder = useCallback(
    async (folderId: string, name: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from(type === 'map' ? 'map_folders' : 'token_folders')
          .update({ name })
          .eq('id', folderId);

        if (error) {
          return { success: false, error: error.message };
        }

        if (type === 'map') {
          updateMapFolder(folderId, { name });
        } else {
          updateTokenFolder(folderId, { name });
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [type, updateMapFolder, updateTokenFolder]
  );

  const deleteFolder = useCallback(
    async (folderId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from(type === 'map' ? 'map_folders' : 'token_folders')
          .delete()
          .eq('id', folderId);

        if (error) {
          return { success: false, error: error.message };
        }

        if (type === 'map') {
          removeMapFolder(folderId);
        } else {
          removeTokenFolder(folderId);
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [type, removeMapFolder, removeTokenFolder]
  );

  return {
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
  };
};
