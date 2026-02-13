import React, { useMemo } from 'react';
import { Circle, Group, Rect } from 'react-konva';
import type { Map, MapEffectTile } from '../../types';
import { MAP_EFFECTS } from '../../lib/mapDecor';

interface MapEffectsLayerProps {
  map: Map;
  pulse: number;
}

const effectByType = Object.fromEntries(MAP_EFFECTS.map((effect) => [effect.type, effect]));

const particleCount = (cellSize: number) => Math.max(3, Math.floor(cellSize / 16));

const buildParticles = (tile: MapEffectTile, cellSize: number, pulse: number) => {
  const count = particleCount(cellSize);
  const particles = [];

  for (let i = 0; i < count; i += 1) {
    const seedBase = tile.seed + i * 997;
    const xOffset = ((seedBase % 89) / 89) * cellSize;
    const yOffset = (((seedBase >> 1) % 113) / 113) * cellSize;
    const wobble = Math.sin(pulse * 0.004 + seedBase) * (cellSize * 0.08);
    const radius = Math.max(2, cellSize * (0.05 + ((seedBase % 11) / 100)));
    const alpha = 0.25 + ((Math.sin(pulse * 0.006 + seedBase) + 1) / 2) * 0.5;

    particles.push({ xOffset: xOffset + wobble, yOffset: yOffset + wobble, radius, alpha });
  }

  return particles;
};

export const MapEffectsLayer: React.FC<MapEffectsLayerProps> = ({ map, pulse }) => {
  const tiles = useMemo(() => map.effectData || [], [map.effectData]);

  if (!map.effectsEnabled || !map.gridEnabled || tiles.length === 0) {
    return null;
  }

  const cellSize = map.gridCellSize;

  return (
    <Group listening={false}>
      {tiles.map((tile) => {
        const effect = effectByType[tile.type];
        if (!effect) return null;

        const x = map.gridOffsetX + tile.gridX * cellSize;
        const y = map.gridOffsetY + tile.gridY * cellSize;
        const particles = buildParticles(tile, cellSize, pulse);

        return (
          <Group key={tile.id}>
            <Rect x={x} y={y} width={cellSize} height={cellSize} fill={effect.color} opacity={0.18} />
            {particles.map((p, idx) => (
              <Circle
                key={`${tile.id}-${idx}`}
                x={x + p.xOffset}
                y={y + p.yOffset}
                radius={p.radius}
                fill={effect.color}
                opacity={p.alpha}
              />
            ))}
          </Group>
        );
      })}
    </Group>
  );
};
