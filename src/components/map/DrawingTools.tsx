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

export const DrawingTools: React.FC = () => {
  const isGM = useIsGM();
  const drawingTool = useMapStore((state) => state.drawingTool);
  const drawingColor = useMapStore((state) => state.drawingColor);
  const setDrawingTool = useMapStore((state) => state.setDrawingTool);
  const setDrawingColor = useMapStore((state) => state.setDrawingColor);
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
    <div className="bg-storm-900/90 backdrop-blur-sm rounded-lg border border-storm-700 p-3 flex flex-col gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-storm-400 mb-2">Draw</p>
        <div className="flex flex-wrap gap-2">
          {TOOL_DEFINITIONS.map(({ tool, label, icon }) => (
            <button
              key={tool}
              onClick={() => handleToolSelect(tool)}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors ${
                drawingTool === tool
                  ? 'bg-storm-700 border-storm-400 text-storm-100'
                  : 'border-storm-700 text-storm-300 hover:text-storm-100 hover:border-storm-500'
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
        <p className="text-xs uppercase tracking-wide text-storm-400 mb-2">Colors</p>
        <div className="flex flex-wrap gap-2">
          {DRAWING_COLOR_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleColorSelect(value)}
              className={`w-6 h-6 rounded border-2 ${
                drawingColor === value ? 'border-storm-100' : 'border-storm-700'
              }`}
              style={{ backgroundColor: value }}
              title={label}
            >
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
