import React, { useState, useEffect, useCallback } from 'react';
import { Save, FileText } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from './Button';
import { useToast } from './Toast';

export const NotepadPanel: React.FC = () => {
  const { showToast } = useToast();
  const session = useSessionStore((state) => state.session);
  const { updateNotepad } = useSession();

  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with session notepad content
  useEffect(() => {
    if (session?.notepadContent !== undefined) {
      setContent(session.notepadContent);
      setIsDirty(false);
    }
  }, [session?.notepadContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    setIsSaving(true);
    await updateNotepad(content);
    setIsDirty(false);
    setIsSaving(false);
    showToast('Notes saved', 'success');
  }, [content, isDirty, updateNotepad, showToast]);

  // Auto-save on blur or after delay
  useEffect(() => {
    if (!isDirty) return;

    const timeout = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [content, isDirty, handleSave]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-storm-700">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-storm-400" />
          <h3 className="font-medium text-storm-200">Shared Notes</h3>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-storm-400">Unsaved changes</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={handleChange}
          onBlur={handleSave}
          placeholder="Write notes here... All players can see and edit these notes."
          className="w-full h-full bg-storm-800 border border-storm-600 rounded-lg p-3 text-storm-100 placeholder-storm-500 resize-none focus:outline-none focus:ring-2 focus:ring-storm-500"
        />
      </div>

      <p className="px-4 pb-4 text-xs text-storm-500">
        Notes are shared with all players and auto-saved.
      </p>
    </div>
  );
};
