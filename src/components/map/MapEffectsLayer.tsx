import React, { useMemo, useState, useEffect } from 'react';
import { Circle, Group, Rect } from 'react-konva';
import type { EffectTile } from '../../types';

interface MapEffectsLayerProps {
  cellSize: number;
  offsetX: number;
  offsetY: number;
  tiles: EffectTile[];
}

const EFFECT_COLORS: Record<EffectTile['effect'], string> = {
  fire: '#f97316',
  poison: '#84cc16',
  water: '#38bdf8',
  ice: '#93c5fd',
  arcane: '#a855f7',
  darkness: '#111827',
};

export const MapEffectsLayer: React.FC<MapEffectsLayerProps> = ({ cellSize, offsetX, offsetY, tiles }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((prev) => (prev + 1) % 10_000), 120);
    return () => window.clearInterval(id);
  }, []);

  const pulse = useMemo(() => 0.65 + Math.sin(tick / 3) * 0.2, [tick]);

  return (
    <Group listening={false}>
      {tiles.map((tile) => {
        const x = offsetX + tile.col * cellSize;
        const y = offsetY + tile.row * cellSize;
        const color = EFFECT_COLORS[tile.effect];

        return (
          <Group key={tile.id}>
            <Rect x={x} y={y} width={cellSize} height={cellSize} fill={color} opacity={tile.effect === 'darkness' ? 0.45 : 0.18 + pulse * 0.15} />
            <Circle
              x={x + cellSize / 2 + Math.sin((tick + tile.col * 9) / 5) * (cellSize * 0.08)}
              y={y + cellSize / 2 + Math.cos((tick + tile.row * 9) / 5) * (cellSize * 0.08)}
              radius={cellSize * 0.18}
              fill={color}
              opacity={tile.effect === 'darkness' ? 0.35 : 0.28 + pulse * 0.15}
            />
          </Group>
        );
      })}
    </Group>
  );
};
