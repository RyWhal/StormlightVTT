import React, { useEffect, useMemo, useState } from 'react';
import { Circle, Group, Rect, RegularPolygon, Star } from 'react-konva';
import type { EffectTile } from '../../types';

interface MapEffectsLayerProps {
  cellSize: number;
  offsetX: number;
  offsetY: number;
  tiles: EffectTile[];
}

const EFFECT_COLORS: Record<EffectTile['effect'], { base: string; glow: string; spark: string }> = {
  fire: { base: '#f97316', glow: '#fb923c', spark: '#fde68a' },
  poison: { base: '#84cc16', glow: '#bef264', spark: '#f7fee7' },
  water: { base: '#38bdf8', glow: '#7dd3fc', spark: '#e0f2fe' },
  ice: { base: '#93c5fd', glow: '#bfdbfe', spark: '#eff6ff' },
  arcane: { base: '#a855f7', glow: '#c084fc', spark: '#f5d0fe' },
  darkness: { base: '#111827', glow: '#374151', spark: '#9ca3af' },
};

const PARTICLES_PER_TILE = 8;

const seeded = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export const MapEffectsLayer: React.FC<MapEffectsLayerProps> = ({ cellSize, offsetX, offsetY, tiles }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((prev) => (prev + 1) % 1_000_000), 33);
    return () => window.clearInterval(id);
  }, []);

  const t = tick / 30;

  const particleSeeds = useMemo(
    () => Array.from({ length: PARTICLES_PER_TILE }, (_, i) => i + 1),
    []
  );

  return (
    <Group listening={false}>
      {tiles.map((tile) => {
        const x = offsetX + tile.col * cellSize;
        const y = offsetY + tile.row * cellSize;
        const palette = EFFECT_COLORS[tile.effect];
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;
        const phase = seeded(tile.col * 173 + tile.row * 97) * Math.PI * 2;

        const pulse = 0.65 + Math.sin(t * 1.9 + phase) * 0.2;
        const swirl = Math.sin(t * 0.8 + phase) * 0.12;

        return (
          <Group key={tile.id}>
            {/* Base tile tint */}
            <Rect
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill={palette.base}
              opacity={tile.effect === 'darkness' ? 0.52 : 0.16 + pulse * 0.1}
            />

            {/* Inner glow disk */}
            <Circle
              x={centerX}
              y={centerY}
              radius={cellSize * (0.27 + swirl)}
              fill={palette.glow}
              opacity={tile.effect === 'darkness' ? 0.24 : 0.16 + pulse * 0.2}
            />

            {/* Effect-specific animated core */}
            {tile.effect === 'fire' && (
              <RegularPolygon
                x={centerX + Math.sin(t * 2.3 + phase) * (cellSize * 0.07)}
                y={centerY + Math.cos(t * 2 + phase) * (cellSize * 0.07)}
                sides={3}
                radius={cellSize * (0.22 + Math.sin(t * 2.8 + phase) * 0.04)}
                fill={palette.glow}
                rotation={t * 120}
                opacity={0.3 + pulse * 0.2}
              />
            )}

            {tile.effect === 'water' && (
              <RegularPolygon
                x={centerX}
                y={centerY}
                sides={6}
                radius={cellSize * (0.2 + Math.sin(t * 1.7 + phase) * 0.03)}
                fill={palette.glow}
                opacity={0.22 + pulse * 0.15}
                rotation={t * 35}
              />
            )}

            {tile.effect === 'arcane' && (
              <Star
                x={centerX}
                y={centerY}
                numPoints={5}
                innerRadius={cellSize * 0.08}
                outerRadius={cellSize * (0.2 + Math.sin(t * 1.3 + phase) * 0.03)}
                fill={palette.glow}
                opacity={0.2 + pulse * 0.22}
                rotation={t * 55}
              />
            )}

            {tile.effect === 'ice' && (
              <Star
                x={centerX}
                y={centerY}
                numPoints={8}
                innerRadius={cellSize * 0.05}
                outerRadius={cellSize * (0.18 + Math.sin(t * 1.1 + phase) * 0.03)}
                fill={palette.spark}
                opacity={0.12 + pulse * 0.15}
                rotation={t * 30}
              />
            )}

            {tile.effect === 'poison' && (
              <Circle
                x={centerX + Math.sin(t * 1.2 + phase) * (cellSize * 0.05)}
                y={centerY + Math.cos(t * 1.4 + phase) * (cellSize * 0.05)}
                radius={cellSize * (0.16 + Math.sin(t * 1.5 + phase) * 0.04)}
                fill={palette.glow}
                opacity={0.18 + pulse * 0.2}
              />
            )}

            {tile.effect === 'darkness' && (
              <Circle
                x={centerX}
                y={centerY}
                radius={cellSize * (0.32 + Math.sin(t * 0.9 + phase) * 0.03)}
                fill={palette.base}
                opacity={0.36 + pulse * 0.12}
              />
            )}

            {/* Ambient particles */}
            {particleSeeds.map((idx) => {
              const seed = seeded((tile.col + 1) * 1000 + (tile.row + 1) * 100 + idx * 17);
              const orbit = cellSize * (0.08 + seed * 0.32);
              const speed = 0.5 + seed * 1.4;
              const a = t * speed + phase + idx;
              const px = centerX + Math.cos(a) * orbit;
              const py = centerY + Math.sin(a * (tile.effect === 'water' ? 0.7 : 1)) * orbit;
              const radius = cellSize * (0.018 + seed * 0.035);

              return (
                <Circle
                  key={`${tile.id}-p-${idx}`}
                  x={px}
                  y={py}
                  radius={radius}
                  fill={tile.effect === 'darkness' ? palette.glow : palette.spark}
                  opacity={tile.effect === 'darkness' ? 0.08 + pulse * 0.06 : 0.12 + pulse * 0.2}
                />
              );
            })}
          </Group>
        );
      })}
    </Group>
  );
};
