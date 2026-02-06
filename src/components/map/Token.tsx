import React, { useRef } from 'react';
import { Group, Circle, Text, Image as KonvaImage, Ring } from 'react-konva';
import useImage from 'use-image';
import { TOKEN_SIZE_MULTIPLIERS, type TokenSize } from '../../types';

interface TokenProps {
  id: string;
  type: 'character' | 'npc';
  name: string;
  imageUrl: string | null;
  x: number;
  y: number;
  size: TokenSize;
  gridCellSize: number;
  isSelected: boolean;
  isDraggable: boolean;
  isHidden: boolean;
  isGM: boolean;
  onSelect: () => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
}

// Color palette for tokens without images
const TOKEN_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const getColorForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TOKEN_COLORS[Math.abs(hash) % TOKEN_COLORS.length];
};

export const Token: React.FC<TokenProps> = ({
  name,
  imageUrl,
  x,
  y,
  size,
  gridCellSize,
  isSelected,
  isDraggable,
  isHidden,
  isGM,
  onSelect,
  onDragStart,
  onDragEnd,
}) => {
  const groupRef = useRef<any>(null);
  const [image] = useImage(imageUrl || '');

  const pixelSize = gridCellSize * TOKEN_SIZE_MULTIPLIERS[size];
  const radius = pixelSize / 2;
  const color = getColorForName(name);

  // Don't render hidden NPCs for non-GMs
  if (isHidden && !isGM) {
    return null;
  }

  const handleDragEnd = (e: any) => {
    const node = e.target;
    onDragEnd(node.x(), node.y());
  };

  const handleDragStart = () => {
    onDragStart?.();
  };

  const opacity = isHidden ? 0.4 : 1;

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
      opacity={opacity}
    >
      {/* Selection ring */}
      {isSelected && (
        <Ring
          x={radius}
          y={radius}
          innerRadius={radius - 2}
          outerRadius={radius + 4}
          fill="rgba(59, 130, 246, 0.5)"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      )}

      {/* Token body */}
      {image ? (
        // Image token
        <Group>
          <Circle
            x={radius}
            y={radius}
            radius={radius}
            fill="#1f2937"
            stroke={isSelected ? '#3b82f6' : '#374151'}
            strokeWidth={2}
          />
          <Group
            clipFunc={(ctx: any) => {
              ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
            }}
          >
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={pixelSize}
              height={pixelSize}
            />
          </Group>
        </Group>
      ) : (
        // Default token (colored circle with initial)
        <Group>
          <Circle
            x={radius}
            y={radius}
            radius={radius}
            fill={color}
            stroke={isSelected ? '#3b82f6' : '#1f2937'}
            strokeWidth={3}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.3}
          />
          <Text
            x={0}
            y={radius - pixelSize * 0.2}
            width={pixelSize}
            height={pixelSize * 0.5}
            text={name.charAt(0).toUpperCase()}
            fontSize={pixelSize * 0.5}
            fontStyle="bold"
            fill="white"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}

      {/* Name label */}
      <Text
        x={0}
        y={pixelSize + 4}
        width={pixelSize}
        text={name}
        fontSize={12}
        fill="#e5e7eb"
        align="center"
        ellipsis
        wrap="none"
      />

      {/* Hidden indicator for GM */}
      {isHidden && isGM && (
        <Text
          x={pixelSize - 16}
          y={-4}
          text="👁"
          fontSize={14}
        />
      )}
    </Group>
  );
};
