import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { useHandouts } from '../../hooks/useHandouts';

export const HandoutViewer: React.FC = () => {
  const { handouts } = useHandouts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (handouts.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !handouts.some((handout) => handout.id === selectedId)) {
      setSelectedId(handouts[0].id);
    }
  }, [handouts, selectedId]);

  const selectedHandout = useMemo(
    () => handouts.find((handout) => handout.id === selectedId) || null,
    [handouts, selectedId]
  );

  return (
    <div className="w-full h-full flex bg-storm-950">
      <div className="w-72 border-r border-storm-800 bg-storm-900/60">
        <div className="p-3 text-sm font-medium text-storm-300 border-b border-storm-800">
          Handouts
        </div>
        <div className="p-2 space-y-2 overflow-y-auto h-[calc(100%-48px)]">
          {handouts.length === 0 ? (
            <div className="text-sm text-storm-500 text-center py-8">
              No handouts shared yet.
            </div>
          ) : (
            handouts.map((handout) => {
              const isActive = handout.id === selectedId;
              return (
                <button
                  key={handout.id}
                  type="button"
                  onClick={() => setSelectedId(handout.id)}
                  className={`w-full text-left px-3 py-2 rounded border transition ${
                    isActive
                      ? 'bg-storm-800 border-storm-600 text-storm-100'
                      : 'bg-storm-900 border-storm-800 text-storm-300 hover:bg-storm-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-storm-700 flex items-center justify-center">
                      {handout.kind === 'text' ? (
                        <FileText className="w-3.5 h-3.5 text-storm-300" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-storm-300" />
                      )}
                    </span>
                    <span className="text-sm font-medium truncate">{handout.title}</span>
                  </div>
                  <div className="text-xs text-storm-500 capitalize mt-1">{handout.kind}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-storm-800 bg-storm-900/60">
          <h2 className="text-lg font-semibold text-storm-100">
            {selectedHandout ? selectedHandout.title : 'Select a handout'}
          </h2>
          {selectedHandout && (
            <p className="text-xs text-storm-500 capitalize">{selectedHandout.kind}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedHandout ? (
            <div className="text-storm-500 text-sm text-center py-12">
              Choose a handout from the list to view it here.
            </div>
          ) : selectedHandout.kind === 'image' ? (
            selectedHandout.imageUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={selectedHandout.imageUrl}
                  alt={selectedHandout.title}
                  className="max-h-full max-w-full rounded shadow-lg object-contain"
                />
              </div>
            ) : (
              <div className="text-sm text-storm-500">Image not available.</div>
            )
          ) : (
            <div className="whitespace-pre-wrap text-storm-100 leading-relaxed">
              {selectedHandout.body || 'No text content.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
