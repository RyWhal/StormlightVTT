import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useMapStore, getFogBrushPixelSize } from '../../stores/mapStore';
import { useSessionStore, useIsGM } from '../../stores/sessionStore';
import { useCharacters } from '../../hooks/useCharacters';
import { useNPCs } from '../../hooks/useNPCs';
import { useMap } from '../../hooks/useMap';
import { Token } from './Token';
import { GridOverlay } from './GridOverlay';
import { FogLayer } from './FogLayer';
import type { FogRegion } from '../../types';

export const MapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const activeMap = useMapStore((state) => state.activeMap);
  const {
    viewportScale,
    viewportX,
    viewportY,
    selectedTokenId,
    selectedTokenType,
    fogToolMode,
    fogBrushSize,
    setViewportScale,
    setViewportPosition,
    selectToken,
    clearSelection,
    addFogRegion,
  } = useMapStore();

  const currentUser = useSessionStore((state) => state.currentUser);
  const isGM = useIsGM();
  const { characters, moveCharacterPosition, myCharacter } = useCharacters();
  const { currentMapNPCs, moveNPCPosition } = useNPCs();
  const { updateFogData } = useMap();

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [mapImage] = useImage(activeMap?.imageUrl || '');
  const [currentFogStroke, setCurrentFogStroke] = useState<{ x: number; y: number }[]>([]);
  const [isPainting, setIsPainting] = useState(false);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewportScale;
      const pointer = stage.getPointerPosition();

      const scaleBy = 1.1;
      const newScale =
        e.evt.deltaY > 0
          ? Math.max(0.1, oldScale / scaleBy)
          : Math.min(5, oldScale * scaleBy);

      // Calculate new position to zoom towards pointer
      const mousePointTo = {
        x: (pointer.x - viewportX) / oldScale,
        y: (pointer.y - viewportY) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setViewportScale(newScale);
      setViewportPosition(newPos.x, newPos.y);
    },
    [viewportScale, viewportX, viewportY, setViewportScale, setViewportPosition]
  );

  // Handle stage drag
  const handleDragEnd = useCallback(
    (e: any) => {
      if (e.target === stageRef.current) {
        setViewportPosition(e.target.x(), e.target.y());
      }
    },
    [setViewportPosition]
  );

  // Handle background click to deselect
  const handleStageClick = useCallback(
    (e: any) => {
      if (e.target === stageRef.current || e.target.attrs?.name === 'background') {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Handle token movement
  const handleTokenDragEnd = useCallback(
    async (id: string, type: 'character' | 'npc', x: number, y: number) => {
      if (type === 'character') {
        await moveCharacterPosition(id, x, y);
      } else {
        await moveNPCPosition(id, x, y);
      }
    },
    [moveCharacterPosition, moveNPCPosition]
  );

  // Can user move this token?
  const canMoveToken = useCallback(
    (type: 'character' | 'npc', ownerId?: string | null) => {
      if (isGM) return true;
      if (type === 'character' && ownerId === currentUser?.username) return true;
      return false;
    },
    [isGM, currentUser]
  );

  // Fog painting handlers
  const handleFogMouseDown = useCallback(
    (e: any) => {
      if (!fogToolMode || !isGM || !activeMap) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      const x = (pointer.x - viewportX) / viewportScale;
      const y = (pointer.y - viewportY) / viewportScale;

      setIsPainting(true);
      setCurrentFogStroke([{ x, y }]);
    },
    [fogToolMode, isGM, activeMap, viewportX, viewportY, viewportScale]
  );

  const handleFogMouseMove = useCallback(
    (e: any) => {
      if (!isPainting || !fogToolMode || !isGM) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      const x = (pointer.x - viewportX) / viewportScale;
      const y = (pointer.y - viewportY) / viewportScale;

      setCurrentFogStroke((prev) => [...prev, { x, y }]);
    },
    [isPainting, fogToolMode, isGM, viewportX, viewportY, viewportScale]
  );

  const handleFogMouseUp = useCallback(async () => {
    if (!isPainting || !fogToolMode || !isGM || !activeMap) return;

    setIsPainting(false);

    if (currentFogStroke.length > 0) {
      const newRegion: FogRegion = {
        type: fogToolMode,
        points: currentFogStroke,
        brushSize: getFogBrushPixelSize(fogBrushSize),
      };

      // Add to local state
      addFogRegion(activeMap.id, newRegion);

      // Save to database
      const newFogData = [...activeMap.fogData, newRegion];
      await updateFogData(activeMap.id, newFogData);
    }

    setCurrentFogStroke([]);
  }, [isPainting, fogToolMode, isGM, activeMap, currentFogStroke, fogBrushSize, addFogRegion, updateFogData]);

  if (!activeMap) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-storm-950">
        <div className="text-center">
          <p className="text-storm-400 text-lg mb-2">No map loaded</p>
          {isGM ? (
            <p className="text-storm-500 text-sm">
              Upload a map from the GM panel to get started
            </p>
          ) : (
            <p className="text-storm-500 text-sm">
              Waiting for GM to load a map...
            </p>
          )}
        </div>
      </div>
    );
  }

  const gridCellSize = activeMap.gridCellSize;

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-storm-950 overflow-hidden"
      style={{ cursor: fogToolMode ? 'crosshair' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={viewportScale}
        scaleY={viewportScale}
        x={viewportX}
        y={viewportY}
        draggable={!fogToolMode}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onMouseDown={fogToolMode ? handleFogMouseDown : undefined}
        onMouseMove={fogToolMode ? handleFogMouseMove : undefined}
        onMouseUp={fogToolMode ? handleFogMouseUp : undefined}
        onMouseLeave={fogToolMode ? handleFogMouseUp : undefined}
      >
        {/* Map image layer */}
        <Layer>
          <KonvaImage
            image={mapImage}
            width={activeMap.width}
            height={activeMap.height}
            name="background"
          />
        </Layer>

        {/* Grid overlay */}
        {activeMap.gridEnabled && (
          <Layer>
            <GridOverlay
              width={activeMap.width}
              height={activeMap.height}
              cellSize={gridCellSize}
              offsetX={activeMap.gridOffsetX}
              offsetY={activeMap.gridOffsetY}
              color={activeMap.gridColor}
            />
          </Layer>
        )}

        {/* NPC tokens (below player tokens) */}
        <Layer>
          {currentMapNPCs
            .filter((npc) => npc.isVisible || isGM)
            .map((npc) => (
              <Token
                key={npc.id}
                id={npc.id}
                type="npc"
                name={npc.displayName || 'NPC'}
                imageUrl={npc.tokenUrl}
                x={npc.positionX}
                y={npc.positionY}
                size={npc.size || 'medium'}
                gridCellSize={gridCellSize}
                isSelected={selectedTokenId === npc.id && selectedTokenType === 'npc'}
                isDraggable={canMoveToken('npc')}
                isHidden={!npc.isVisible}
                isGM={isGM}
                onSelect={() => selectToken(npc.id, 'npc')}
                onDragEnd={(x, y) => handleTokenDragEnd(npc.id, 'npc', x, y)}
              />
            ))}
        </Layer>

        {/* Player character tokens */}
        {activeMap.showPlayerTokens && (
          <Layer>
            {characters.map((char) => (
              <Token
                key={char.id}
                id={char.id}
                type="character"
                name={char.name}
                imageUrl={char.tokenUrl}
                x={char.positionX}
                y={char.positionY}
                size="medium"
                gridCellSize={gridCellSize}
                isSelected={selectedTokenId === char.id && selectedTokenType === 'character'}
                isDraggable={canMoveToken('character', char.claimedByUsername)}
                isHidden={false}
                isGM={isGM}
                onSelect={() => selectToken(char.id, 'character')}
                onDragEnd={(x, y) => handleTokenDragEnd(char.id, 'character', x, y)}
              />
            ))}
          </Layer>
        )}

        {/* Fog of war layer */}
        {activeMap.fogEnabled && (
          <Layer>
            <FogLayer
              width={activeMap.width}
              height={activeMap.height}
              fogData={activeMap.fogData}
              defaultState={activeMap.fogDefaultState}
              isGM={isGM}
              currentStroke={isPainting ? currentFogStroke : []}
              currentBrushSize={getFogBrushPixelSize(fogBrushSize)}
              currentMode={fogToolMode}
            />
          </Layer>
        )}
      </Stage>

      {/* Fog tool indicator */}
      {fogToolMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-storm-900/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-storm-600">
          <span className="text-storm-100">
            Fog Tool: <span className="font-semibold capitalize">{fogToolMode}</span>
          </span>
        </div>
      )}
    </div>
  );
};
