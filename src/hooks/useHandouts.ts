import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { supabase, uploadFile, deleteFile, STORAGE_BUCKETS } from '../lib/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useMapStore } from '../stores/mapStore';
import { dbHandoutToHandout, type DbHandout, type Handout } from '../types';

export const useHandouts = () => {
  const session = useSessionStore((state) => state.session);
  const { handouts, addHandout, updateHandout, removeHandout } = useMapStore();

  const createTextHandout = useCallback(
    async (title: string, body: string): Promise<{ success: boolean; handout?: Handout; error?: string }> => {
      if (!session) {
        return { success: false, error: 'Not in a session' };
      }

      try {
        const { data, error } = await supabase
          .from('handouts')
          .insert({
            session_id: session.id,
            title,
            kind: 'text',
            body,
            sort_order: handouts.length,
          })
          .select()
          .single();

        if (error || !data) {
          return { success: false, error: error?.message || 'Failed to create handout' };
        }

        const newHandout = dbHandoutToHandout(data as DbHandout);
        addHandout(newHandout);
        return { success: true, handout: newHandout };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [session, handouts.length, addHandout]
  );

  const createImageHandout = useCallback(
    async (
      title: string,
      file: File
    ): Promise<{ success: boolean; handout?: Handout; error?: string }> => {
      if (!session) {
        return { success: false, error: 'Not in a session' };
      }

      try {
        const fileId = nanoid();
        const extension = file.name.split('.').pop() || 'png';
        const storagePath = `${session.id}/${fileId}.${extension}`;

        const uploadResult = await uploadFile(STORAGE_BUCKETS.HANDOUTS, storagePath, file);
        if ('error' in uploadResult) {
          return { success: false, error: uploadResult.error };
        }

        const { data, error } = await supabase
          .from('handouts')
          .insert({
            session_id: session.id,
            title,
            kind: 'image',
            image_url: uploadResult.url,
            sort_order: handouts.length,
          })
          .select()
          .single();

        if (error || !data) {
          await deleteFile(STORAGE_BUCKETS.HANDOUTS, storagePath);
          return { success: false, error: error?.message || 'Failed to create handout' };
        }

        const newHandout = dbHandoutToHandout(data as DbHandout);
        addHandout(newHandout);
        return { success: true, handout: newHandout };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [session, handouts.length, addHandout]
  );

  const updateHandoutDetails = useCallback(
    async (
      handoutId: string,
      updates: Partial<Pick<Handout, 'title' | 'body'>>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.body !== undefined) dbUpdates.body = updates.body;

        const { error } = await supabase
          .from('handouts')
          .update(dbUpdates)
          .eq('id', handoutId);

        if (error) {
          return { success: false, error: error.message };
        }

        updateHandout(handoutId, updates);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [updateHandout]
  );

  const deleteHandout = useCallback(
    async (handoutId: string): Promise<{ success: boolean; error?: string }> => {
      const handout = handouts.find((item) => item.id === handoutId);
      if (!handout) {
        return { success: false, error: 'Handout not found' };
      }

      try {
        const { error } = await supabase.from('handouts').delete().eq('id', handoutId);
        if (error) {
          return { success: false, error: error.message };
        }

        if (handout.kind === 'image' && handout.imageUrl) {
          const storagePath = handout.imageUrl.split('/').slice(-2).join('/');
          await deleteFile(STORAGE_BUCKETS.HANDOUTS, storagePath);
        }

        removeHandout(handoutId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [handouts, removeHandout]
  );

  return {
    handouts,
    createTextHandout,
    createImageHandout,
    updateHandoutDetails,
    deleteHandout,
  };
};
