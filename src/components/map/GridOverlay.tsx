import React, { useMemo } from 'react';
import { Line, Group } from 'react-konva';

interface GridOverlayProps {
  width: number;
  height: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  color: string;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  width,
  height,
  cellSize,
  offsetX,
  offsetY,
  color,
}) => {
  const lines = useMemo(() => {
    const result: JSX.Element[] = [];

    // Calculate start positions accounting for offset
    const startX = offsetX % cellSize;
    const startY = offsetY % cellSize;

    // Vertical lines
    for (let x = startX; x <= width; x += cellSize) {
      result.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={color}
          strokeWidth={1}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= height; y += cellSize) {
      result.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={color}
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return result;
  }, [width, height, cellSize, offsetX, offsetY, color]);

  return <Group listening={false}>{lines}</Group>;
};
