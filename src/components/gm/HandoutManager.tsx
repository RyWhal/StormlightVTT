import React, { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useHandouts } from '../../hooks/useHandouts';
import { validateHandoutUpload } from '../../lib/validation';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useToast } from '../shared/Toast';

type HandoutType = 'text' | 'image';

export const HandoutManager: React.FC = () => {
  const { showToast } = useToast();
  const { handouts, createTextHandout, createImageHandout, deleteHandout } = useHandouts();
  const [isCreating, setIsCreating] = useState(false);
  const [handoutType, setHandoutType] = useState<HandoutType>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validateHandoutUpload(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid file', 'error');
      return;
    }
    setImageFile(file);
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setImageFile(null);
    setHandoutType('text');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    const result =
      handoutType === 'text'
        ? await createTextHandout(title.trim(), body.trim())
        : imageFile
          ? await createImageHandout(title.trim(), imageFile)
          : { success: false, error: 'Select an image to upload' };
    setIsSubmitting(false);

    if (result.success) {
      showToast('Handout created', 'success');
      setIsCreating(false);
      resetForm();
    } else {
      showToast(result.error || 'Failed to create handout', 'error');
    }
  };

  const handleDelete = async (handoutId: string) => {
    if (!confirm('Delete this handout?')) return;
    const result = await deleteHandout(handoutId);
    if (result.success) {
      showToast('Handout deleted', 'success');
    } else {
      showToast(result.error || 'Failed to delete handout', 'error');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-storm-300">Handouts</h3>
        {!isCreating && (
          <Button variant="ghost" size="sm" onClick={() => setIsCreating(true)}>
            <Upload className="w-4 h-4 mr-1" />
            New
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="mb-4 p-3 bg-storm-800 rounded-lg border border-storm-600 space-y-3">
          <Input
            placeholder="Handout title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={handoutType === 'text' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setHandoutType('text')}
            >
              <FileText className="w-4 h-4 mr-1" />
              Text
            </Button>
            <Button
              variant={handoutType === 'image' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setHandoutType('image')}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Image
            </Button>
          </div>

          {handoutType === 'text' ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Paste or type handout text..."
              className="w-full rounded bg-storm-700 border border-storm-600 px-3 py-2 text-sm text-storm-100 focus:outline-none focus:border-storm-400 resize-none"
            />
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                {imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageFile && (
                <p className="text-xs text-storm-400 truncate">{imageFile.name}</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!title.trim() || isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {handouts.length === 0 ? (
        <p className="text-storm-500 text-sm text-center py-4">
          No handouts yet
        </p>
      ) : (
        <div className="space-y-2">
          {handouts.map((handout) => (
            <div
              key={handout.id}
              className="flex items-center gap-2 p-2 bg-storm-800/50 rounded border border-storm-700"
            >
              <div className="w-8 h-8 rounded bg-storm-700 flex items-center justify-center">
                {handout.kind === 'text' ? (
                  <FileText className="w-4 h-4 text-storm-300" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-storm-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-storm-200 truncate">{handout.title}</p>
                <p className="text-xs text-storm-500 capitalize">{handout.kind}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(handout.id)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
