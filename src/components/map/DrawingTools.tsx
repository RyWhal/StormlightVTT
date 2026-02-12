import React from 'react';
import {
  PencilLine,
  Minus,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Eraser,
} from 'lucide-react';
import { DRAWING_COLOR_OPTIONS, isDrawingColor } from '../../types';
import { useMapStore } from '../../stores/mapStore';
import { useIsGM } from '../../stores/sessionStore';

const TOOL_DEFINITIONS = [
  { tool: 'free' as const, label: 'Free draw', icon: <PencilLine className="w-4 h-4" /> },
  { tool: 'line' as const, label: 'Line', icon: <Minus className="w-4 h-4" /> },
  { tool: 'square' as const, label: 'Square', icon: <SquareIcon className="w-4 h-4" /> },
  { tool: 'circle' as const, label: 'Circle', icon: <CircleIcon className="w-4 h-4" /> },
  { tool: 'triangle' as const, label: 'Triangle', icon: <TriangleIcon className="w-4 h-4" /> },
  { tool: 'eraser' as const, label: 'Eraser', icon: <Eraser className="w-4 h-4" /> },
];

const STROKE_SIZES = [
  { label: 'Fine', value: 2 },
  { label: 'Small', value: 4 },
  { label: 'Medium', value: 8 },
  { label: 'Large', value: 12 },
];

export const DrawingTools: React.FC = () => {
  const isGM = useIsGM();
  const drawingTool = useMapStore((state) => state.drawingTool);
  const drawingColor = useMapStore((state) => state.drawingColor);
  const drawingStrokeWidth = useMapStore((state) => state.drawingStrokeWidth);
  const setDrawingTool = useMapStore((state) => state.setDrawingTool);
  const setDrawingColor = useMapStore((state) => state.setDrawingColor);
  const setDrawingStrokeWidth = useMapStore((state) => state.setDrawingStrokeWidth);
  const setFogToolMode = useMapStore((state) => state.setFogToolMode);

  const handleToolSelect = (tool: typeof drawingTool) => {
    if (isGM) {
      setFogToolMode(null);
    }
    setDrawingTool(drawingTool === tool ? null : tool);
  };

  const handleColorSelect = (color: string) => {
    if (!isDrawingColor(color)) return;
    setDrawingColor(color);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700 p-3 flex flex-col gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Draw</p>
        <div className="flex flex-wrap gap-2">
          {TOOL_DEFINITIONS.map(({ tool, label, icon }) => (
            <button
              key={tool}
              onClick={() => handleToolSelect(tool)}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors ${
                drawingTool === tool
                  ? 'bg-slate-700 border-tempest-400 text-slate-100'
                  : 'border-slate-700 text-slate-300 hover:text-slate-100 hover:border-tempest-500'
              }`}
              title={label}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Colors</p>
        <div className="flex flex-wrap gap-2">
          {DRAWING_COLOR_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleColorSelect(value)}
              className={`w-6 h-6 rounded border-2 ${
                drawingColor === value ? 'border-slate-100' : 'border-slate-700'
              }`}
              style={{ backgroundColor: value }}
              title={label}
            >
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Stroke</p>
        <div className="flex flex-wrap gap-2">
          {STROKE_SIZES.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setDrawingStrokeWidth(value)}
              className={`px-2 py-1 rounded border text-xs transition-colors ${
                drawingStrokeWidth === value
                  ? 'bg-slate-700 border-tempest-400 text-slate-100'
                  : 'border-slate-700 text-slate-300 hover:text-slate-100 hover:border-tempest-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
