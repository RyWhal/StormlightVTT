import React, { useMemo, useState, useRef } from 'react';
import {
  Plus,
  Skull,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  MapPin,
  Library,
  FolderPlus,
  Pencil,
} from 'lucide-react';
import { useNPCs } from '../../hooks/useNPCs';
import { useFolders } from '../../hooks/useFolders';
import { useMapStore } from '../../stores/mapStore';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useToast } from '../shared/Toast';
import { validateTokenUpload } from '../../lib/validation';
import { TOKEN_SIZE_MULTIPLIERS, type TokenSize } from '../../types';
import { GlobalAssetBrowser } from './GlobalAssetBrowser';
import type { GlobalAsset } from '../../hooks/useGlobalAssets';

const SIZE_OPTIONS: TokenSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

export const NPCManager: React.FC = () => {
  const { showToast } = useToast();
  const activeMap = useMapStore((state) => state.activeMap);
  const tokenFolders = useMapStore((state) => state.tokenFolders);
  const { createFolder, renameFolder, deleteFolder } = useFolders('token');
  const {
    npcTemplates,
    currentMapNPCs,
    createNPCTemplate,
    updateNPCTemplateDetails,
    deleteNPCTemplate,
    addNPCToMap,
    toggleNPCVisibility,
    removeNPCFromMap,
  } = useNPCs();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState<TokenSize>('medium');
  const [newTokenFile, setNewTokenFile] = useState<File | null>(null);
  const [selectedGlobalAsset, setSelectedGlobalAsset] = useState<GlobalAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateTokenUpload(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid file', 'error');
      return;
    }

    setNewTokenFile(file);
    setSelectedGlobalAsset(null); // Clear global asset when uploading custom
  };

  const handleSelectGlobalAsset = (asset: GlobalAsset) => {
    setSelectedGlobalAsset(asset);
    setNewTokenFile(null); // Clear file when selecting global asset
    setNewName(asset.name);
    setNewSize((asset.defaultSize as TokenSize) || 'medium');
    setShowAssetBrowser(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setIsSubmitting(true);
    const result = await createNPCTemplate(
      newName,
      newSize,
      newTokenFile || undefined,
      undefined,
      selectedGlobalAsset?.imageUrl,
      selectedFolderId
    );
    setIsSubmitting(false);

    if (result.success) {
      showToast('NPC template created', 'success');
      setIsCreating(false);
      setNewName('');
      setNewSize('medium');
      setNewTokenFile(null);
      setSelectedGlobalAsset(null);
      setSelectedFolderId(null);
    } else {
      showToast(result.error || 'Failed to create NPC template', 'error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this NPC template?')) return;

    const result = await deleteNPCTemplate(id);
    if (result.success) {
      showToast('NPC template deleted', 'success');
    } else {
      showToast(result.error || 'Failed to delete template', 'error');
    }
  };

  const handleAddToMap = async (templateId: string) => {
    if (!activeMap) {
      showToast('No active map', 'error');
      return;
    }

    const result = await addNPCToMap(templateId);
    if (result.success) {
      showToast('NPC added to map', 'success');
    } else {
      showToast(result.error || 'Failed to add NPC', 'error');
    }
  };

  const handleToggleVisibility = async (instanceId: string) => {
    const result = await toggleNPCVisibility(instanceId);
    if (!result.success) {
      showToast(result.error || 'Failed to toggle visibility', 'error');
    }
  };

  const handleRemoveFromMap = async (instanceId: string) => {
    const result = await removeNPCFromMap(instanceId);
    if (result.success) {
      showToast('NPC removed from map', 'success');
    } else {
      showToast(result.error || 'Failed to remove NPC', 'error');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const result = await createFolder(newFolderName.trim());
    if (result.success) {
      showToast('Folder created', 'success');
      setNewFolderName('');
    } else {
      showToast(result.error || 'Failed to create folder', 'error');
    }
  };

  const handleRenameFolder = async (folderId: string, currentName: string) => {
    const name = prompt('Folder name:', currentName);
    if (!name || name.trim() === currentName) return;
    const result = await renameFolder(folderId, name.trim());
    if (result.success) {
      showToast('Folder renamed', 'success');
    } else {
      showToast(result.error || 'Failed to rename folder', 'error');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Tokens inside will become unsorted.')) return;
    const result = await deleteFolder(folderId);
    if (result.success) {
      showToast('Folder deleted', 'success');
    } else {
      showToast(result.error || 'Failed to delete folder', 'error');
    }
  };

  const templatesByFolder = useMemo(() => {
    const grouped: Record<string, typeof npcTemplates> = {};
    npcTemplates.forEach((template) => {
      const key = template.folderId ?? 'unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(template);
    });
    return grouped;
  }, [npcTemplates]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <Button variant="secondary" size="sm" onClick={handleCreateFolder}>
            <FolderPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        {tokenFolders.length > 0 && (
          <div className="space-y-1">
            {tokenFolders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between rounded bg-storm-800/50 border border-storm-700 px-2 py-1"
              >
                <span className="text-xs text-storm-300 truncate">{folder.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRenameFolder(folder.id, folder.name)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NPC Templates Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-storm-300">NPC Library</h3>
          {!isCreating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          )}
        </div>

        {/* Create form */}
        {isCreating && (
          <div className="mb-4 p-3 bg-storm-800 rounded-lg border border-storm-600">
            <div className="space-y-3">
              <Input
                placeholder="NPC name (e.g., Goblin)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />

              <div>
                <label className="text-xs text-storm-400 block mb-1">Folder</label>
                <select
                  value={selectedFolderId ?? ''}
                  onChange={(e) => setSelectedFolderId(e.target.value || null)}
                  className="w-full px-2 py-1.5 bg-storm-700 border border-storm-600 rounded text-sm text-storm-200"
                >
                  <option value="">Unsorted</option>
                  {tokenFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-storm-400 block mb-1">Size</label>
                <select
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value as TokenSize)}
                  className="w-full px-2 py-1.5 bg-storm-700 border border-storm-600 rounded text-sm text-storm-200"
                >
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size.charAt(0).toUpperCase() + size.slice(1)} (
                      {TOKEN_SIZE_MULTIPLIERS[size]}x)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Show selected asset preview */}
                {selectedGlobalAsset && (
                  <div className="flex items-center gap-2 p-2 bg-storm-700 rounded">
                    <img
                      src={selectedGlobalAsset.imageUrl}
                      alt={selectedGlobalAsset.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <span className="text-sm text-storm-200 flex-1 truncate">
                      {selectedGlobalAsset.name}
                    </span>
                    <button
                      onClick={() => setSelectedGlobalAsset(null)}
                      className="text-storm-400 hover:text-storm-200"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAssetBrowser(true)}
                  >
                    <Library className="w-4 h-4 mr-1" />
                    Library
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {newTokenFile ? 'Change' : 'Upload'}
                  </Button>
                </div>
                {newTokenFile && (
                  <p className="text-xs text-storm-400 truncate">{newTokenFile.name}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                    setNewTokenFile(null);
                    setSelectedGlobalAsset(null);
                    setSelectedFolderId(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isSubmitting}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Template list */}
        {npcTemplates.length === 0 ? (
          <p className="text-storm-500 text-sm text-center py-4">
            No NPC templates yet
          </p>
        ) : (
          <div className="space-y-4">
            {[
              { id: 'unassigned', name: 'Unsorted' },
              ...tokenFolders.map((folder) => ({ id: folder.id, name: folder.name })),
            ].map((folder) => {
              const folderTemplates = templatesByFolder[folder.id] || [];
              if (folderTemplates.length === 0) return null;
              return (
                <div key={folder.id} className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-storm-500">{folder.name}</div>
                  {folderTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center gap-2 p-2 bg-storm-800/50 rounded border border-storm-700"
                    >
                      <div className="w-8 h-8 rounded bg-storm-700 overflow-hidden flex-shrink-0">
                        {template.tokenUrl ? (
                          <img
                            src={template.tokenUrl}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Skull className="w-4 h-4 text-storm-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-storm-200 truncate">
                          {template.name}
                        </p>
                        <p className="text-xs text-storm-500 capitalize">
                          {template.defaultSize}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddToMap(template.id)}
                        disabled={!activeMap}
                        title="Add to map"
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <select
                        value={template.folderId ?? ''}
                        onChange={async (event) => {
                          const folderId = event.target.value || null;
                          const result = await updateNPCTemplateDetails(template.id, {
                            folderId,
                          });
                          if (!result.success) {
                            showToast(result.error || 'Failed to move NPC', 'error');
                          }
                        }}
                        className="bg-storm-900/70 border border-storm-600 rounded px-1 py-0.5 text-xs text-storm-200"
                      >
                        <option value="">Unsorted</option>
                        {tokenFolders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NPCs on Current Map */}
      <div>
        <h3 className="text-sm font-medium text-storm-300 mb-3">
          NPCs on Current Map
        </h3>

        {!activeMap ? (
          <p className="text-storm-500 text-sm text-center py-4">
            No active map
          </p>
        ) : currentMapNPCs.length === 0 ? (
          <p className="text-storm-500 text-sm text-center py-4">
            No NPCs on this map
          </p>
        ) : (
          <div className="space-y-2">
            {currentMapNPCs.map((npc) => (
              <div
                key={npc.id}
                className={`
                  flex items-center gap-2 p-2 rounded border
                  ${npc.isVisible ? 'bg-storm-800/50 border-storm-700' : 'bg-storm-800/30 border-storm-700/50'}
                `}
              >
                <div className="w-8 h-8 rounded bg-storm-700 overflow-hidden flex-shrink-0">
                  {npc.tokenUrl ? (
                    <img
                      src={npc.tokenUrl}
                      alt={npc.displayName || 'NPC'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skull className="w-4 h-4 text-storm-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${npc.isVisible ? 'text-storm-200' : 'text-storm-400'}`}
                  >
                    {npc.displayName || 'NPC'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleVisibility(npc.id)}
                  title={npc.isVisible ? 'Hide from players' : 'Show to players'}
                >
                  {npc.isVisible ? (
                    <Eye className="w-4 h-4 text-green-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-storm-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromMap(npc.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Asset Browser Modal */}
      {showAssetBrowser && (
        <GlobalAssetBrowser
          assetType="token"
          onSelect={handleSelectGlobalAsset}
          onClose={() => setShowAssetBrowser(false)}
        />
      )}
    </div>
  );
};
