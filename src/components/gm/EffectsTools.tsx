import React from 'react';
import { Sparkles } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { MAP_EFFECTS } from '../../lib/mapDecor';

export const EffectsTools: React.FC = () => {
  const activeMap = useMapStore((state) => state.activeMap);
  const effectPaintMode = useMapStore((state) => state.effectPaintMode);
  const effectType = useMapStore((state) => state.effectType);
  const setEffectPaintMode = useMapStore((state) => state.setEffectPaintMode);
  const setEffectType = useMapStore((state) => state.setEffectType);
  const setDrawingTool = useMapStore((state) => state.setDrawingTool);
  const setFogToolMode = useMapStore((state) => state.setFogToolMode);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
        <h3 className="text-slate-100 font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Grid Effects
        </h3>
        <p className="text-xs text-slate-400">Paint one effect per grid square. Click again to erase a tile.</p>
        {!activeMap?.effectsEnabled && (
          <p className="text-xs text-amber-300">Enable “Grid Effects Layer” in Maps → map settings first.</p>
        )}

        <button
          onClick={() => {
            if (!effectPaintMode) {
              setFogToolMode(null);
              setDrawingTool(null);
            }
            setEffectPaintMode(!effectPaintMode);
          }}
          disabled={!activeMap?.effectsEnabled}
          className={`w-full rounded border px-3 py-2 text-sm ${effectPaintMode ? 'bg-tempest-500/30 border-tempest-400 text-slate-100' : 'border-slate-600 text-slate-300 hover:border-tempest-400'} disabled:opacity-50`}
        >
          {effectPaintMode ? 'Disable Effect Paint' : 'Enable Effect Paint'}
        </button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {MAP_EFFECTS.map((effect) => (
            <button
              key={effect.type}
              onClick={() => setEffectType(effect.type)}
              className={`rounded border px-2 py-1 text-xs flex items-center gap-2 ${effectType === effect.type ? 'border-tempest-400 bg-slate-700 text-slate-100' : 'border-slate-600 text-slate-300'}`}
            >
              <span>{effect.glyph}</span>
              {effect.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
