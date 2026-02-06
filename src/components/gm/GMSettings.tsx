import React from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useSession } from '../../hooks/useSession';
import { useToast } from '../shared/Toast';
import { SessionExport } from './SessionExport';

export const GMSettings: React.FC = () => {
  const { showToast } = useToast();
  const session = useSessionStore((state) => state.session);
  const { updateSessionSettings } = useSession();

  if (!session) return null;

  const handleToggle = async (
    field: 'allowPlayersRenameNpcs' | 'allowPlayersMoveNpcs' | 'isBlindfolded',
    value: boolean
  ) => {
    const result = await updateSessionSettings({ [field]: value });
    if (!result.success) {
      showToast(result.error || 'Failed to update setting', 'error');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="bg-storm-800/50 rounded-lg p-3 space-y-3">
        <h3 className="text-storm-100 font-semibold">GM Permissions</h3>

        <label className="flex items-center justify-between gap-3 text-sm text-storm-300">
          <span>Allow players to rename NPCs</span>
          <input
            type="checkbox"
            checked={session.allowPlayersRenameNpcs}
            onChange={(e) => handleToggle('allowPlayersRenameNpcs', e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm text-storm-300">
          <span>Allow players to move NPCs</span>
          <input
            type="checkbox"
            checked={session.allowPlayersMoveNpcs}
            onChange={(e) => handleToggle('allowPlayersMoveNpcs', e.target.checked)}
          />
        </label>
      </div>

      <div className="bg-storm-800/50 rounded-lg p-3 space-y-3">
        <h3 className="text-storm-100 font-semibold">GM Controls</h3>

        <label className="flex items-center justify-between gap-3 text-sm text-storm-300">
          <span>GM Blindfold (hide map from players)</span>
          <input
            type="checkbox"
            checked={session.isBlindfolded}
            onChange={(e) => handleToggle('isBlindfolded', e.target.checked)}
          />
        </label>
      </div>

      <div className="bg-storm-800/50 rounded-lg p-3">
        <h3 className="text-storm-100 font-semibold mb-3">Session Export / Import</h3>
        <SessionExport />
      </div>
    </div>
  );
};
