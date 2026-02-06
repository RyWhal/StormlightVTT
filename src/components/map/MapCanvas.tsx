import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Move,
} from 'lucide-react';
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
    stageWidth,
    stageHeight,
    selectedTokenId,
    selectedTokenType,
    fogToolMode,
    fogBrushSize,
    fogToolShape,
    setViewportScale,
    setViewportPosition,
    setStageSize,
    selectToken,
    clearSelection,
    fitMapToView,
    panBy,
    zoomTo,
  } = useMapStore();

  const currentUser = useSessionStore((state) => state.currentUser);
  const isGM = useIsGM();
  const { characters, moveCharacterPosition } = useCharacters();
  const { currentMapNPCs, moveNPCPosition } = useNPCs();
  const { updateFogData } = useMap();

  const [mapImage] = useImage(activeMap?.imageUrl || '');
  const [currentFogStroke, setCurrentFogStroke] = useState<{ x: number; y: number }[]>([]);
  const [isPainting, setIsPainting] = useState(false);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectEnd, setRectEnd] = useState<{ x: number; y: number } | null>(null);

  const syncStageSize = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    setStageSize(width, height);
  }, [setStageSize]);

  // Handle container resize
  useLayoutEffect(() => {
    syncStageSize();

    // Use ResizeObserver for more accurate resize detection
    const resizeObserver = new ResizeObserver(() => {
      syncStageSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', syncStageSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncStageSize);
    };
  }, [syncStageSize]);

  // Fit map to view when map changes or image loads
  useEffect(() => {
    if (activeMap && stageWidth > 0 && stageHeight > 0 && mapImage) {
      // Small delay to ensure stage size is properly set
      const timer = setTimeout(() => fitMapToView(), 100);
      return () => clearTimeout(timer);
    }
  }, [activeMap?.id, mapImage, stageWidth, stageHeight, fitMapToView]);

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
    (_type: 'character' | 'npc') => {
      if (isGM) return true;
      if (!currentUser) return false;
      return true;
    },
    [isGM, currentUser]
  );

  // Convert screen coordinates to map coordinates
  const screenToMap = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - viewportX) / viewportScale,
        y: (screenY - viewportY) / viewportScale,
      };
    },
    [viewportX, viewportY, viewportScale]
  );

  const clampToMapBounds = useCallback(
    (point: { x: number; y: number }) => {
      if (!activeMap) return point;

      return {
        x: Math.max(0, Math.min(activeMap.width, point.x)),
        y: Math.max(0, Math.min(activeMap.height, point.y)),
      };
    },
    [activeMap]
  );

  // Fog painting handlers
  const handleFogMouseDown = useCallback(
    (_e: unknown) => {
      if (!fogToolMode || !isGM || !activeMap) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      const mapPos = clampToMapBounds(screenToMap(pointer.x, pointer.y));

      if (fogToolShape === 'rectangle') {
        setRectStart(mapPos);
        setRectEnd(mapPos);
      } else {
        setIsPainting(true);
        setCurrentFogStroke([mapPos]);
      }
    },
    [fogToolMode, fogToolShape, isGM, activeMap, screenToMap, clampToMapBounds]
  );

  const handleFogMouseMove = useCallback(
    (_e: unknown) => {
      if (!fogToolMode || !isGM) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      const mapPos = clampToMapBounds(screenToMap(pointer.x, pointer.y));

      if (fogToolShape === 'rectangle' && rectStart) {
        setRectEnd(mapPos);
      } else if (isPainting) {
        setCurrentFogStroke((prev) => {
          const lastPoint = prev[prev.length - 1];
          if (lastPoint && lastPoint.x === mapPos.x && lastPoint.y === mapPos.y) {
            return prev;
          }
          return [...prev, mapPos];
        });
      }
    },
    [fogToolMode, fogToolShape, isGM, isPainting, rectStart, screenToMap, clampToMapBounds]
  );

  const handleFogMouseUp = useCallback(async () => {
    if (!fogToolMode || !isGM || !activeMap) return;

    const isWithinMap = (point: { x: number; y: number }) =>
      point.x >= 0 && point.y >= 0 && point.x <= activeMap.width && point.y <= activeMap.height;

    if (fogToolShape === 'rectangle' && rectStart && rectEnd) {
      // Create rectangle fog region constrained to map bounds
      const minX = Math.max(0, Math.min(rectStart.x, rectEnd.x));
      const minY = Math.max(0, Math.min(rectStart.y, rectEnd.y));
      const maxX = Math.min(activeMap.width, Math.max(rectStart.x, rectEnd.x));
      const maxY = Math.min(activeMap.height, Math.max(rectStart.y, rectEnd.y));

      // Only create if rectangle has some size
      if (maxX - minX > 5 && maxY - minY > 5) {
        // Convert rectangle to points (4 corners forming a closed path)
        const points = [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
          { x: minX, y: minY },
        ];

        const newRegion: FogRegion = {
          type: fogToolMode,
          points,
          brushSize: Math.max(maxX - minX, maxY - minY),
        };

        const newFogData = [...activeMap.fogData, newRegion];
        await updateFogData(activeMap.id, newFogData);
      }

      setRectStart(null);
      setRectEnd(null);
    } else if (isPainting && currentFogStroke.length > 1) {
      const boundedStroke = currentFogStroke.filter(isWithinMap);

      if (boundedStroke.length > 1) {
        const newRegion: FogRegion = {
          type: fogToolMode,
          points: boundedStroke,
          brushSize: getFogBrushPixelSize(fogBrushSize),
        };

        const newFogData = [...activeMap.fogData, newRegion];
        await updateFogData(activeMap.id, newFogData);
      }

      setIsPainting(false);
      setCurrentFogStroke([]);
    }
  }, [
    fogToolMode,
    fogToolShape,
    isGM,
    activeMap,
    rectStart,
    rectEnd,
    isPainting,
    currentFogStroke,
    fogBrushSize,
    updateFogData,
  ]);

  // Zoom controls
  const handleZoomIn = () => zoomTo(viewportScale * 1.25);
  const handleZoomOut = () => zoomTo(viewportScale / 1.25);
  const handleFitToView = () => {
    // Ensure fit uses current container size (avoids stale stage dimensions)
    syncStageSize();
    requestAnimationFrame(() => fitMapToView());
  };

  // Pan controls
  const panStep = 100;
  const handlePanUp = () => panBy(0, panStep);
  const handlePanDown = () => panBy(0, -panStep);
  const handlePanLeft = () => panBy(panStep, 0);
  const handlePanRight = () => panBy(-panStep, 0);

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
  const zoomPercent = Math.round(viewportScale * 100);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-storm-950 overflow-hidden relative"
      style={{ cursor: fogToolMode ? 'crosshair' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={Math.max(1, stageWidth)}
        height={Math.max(1, stageHeight)}
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

        {/* Rectangle selection preview for fog */}
        {fogToolMode && fogToolShape === 'rectangle' && rectStart && rectEnd && (
          <Layer>
            <Rect
              x={Math.min(rectStart.x, rectEnd.x)}
              y={Math.min(rectStart.y, rectEnd.y)}
              width={Math.abs(rectEnd.x - rectStart.x)}
              height={Math.abs(rectEnd.y - rectStart.y)}
              stroke={fogToolMode === 'reveal' ? '#00ff00' : '#ff0000'}
              strokeWidth={2 / viewportScale}
              dash={[10 / viewportScale, 5 / viewportScale]}
              fill={fogToolMode === 'reveal' ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)'}
            />
          </Layer>
        )}
      </Stage>

      {/* Fog tool indicator */}
      {fogToolMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-storm-900/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-storm-600">
          <span className="text-storm-100">
            Fog Tool: <span className="font-semibold capitalize">{fogToolMode}</span>
            {' - '}
            <span className="capitalize">{fogToolShape}</span>
          </span>
        </div>
      )}

      {/* Map controls overlay - Bottom left */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {/* Zoom controls */}
        <div className="bg-storm-900/90 backdrop-blur-sm rounded-lg border border-storm-700 p-2">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-storm-700 rounded transition-colors text-storm-300 hover:text-storm-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Zoom slider */}
            <input
              type="range"
              min="10"
              max="500"
              value={zoomPercent}
              onChange={(e) => zoomTo(parseInt(e.target.value) / 100)}
              className="w-24 h-1.5 bg-storm-700 rounded-lg appearance-none cursor-pointer accent-storm-400"
            />

            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-storm-700 rounded transition-colors text-storm-300 hover:text-storm-100"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-storm-400 font-mono">{zoomPercent}%</span>
            <button
              onClick={handleFitToView}
              className="p-1.5 hover:bg-storm-700 rounded transition-colors text-storm-300 hover:text-storm-100"
              title="Fit to View"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pan controls */}
        <div className="bg-storm-900/90 backdrop-blur-sm rounded-lg border border-storm-700 p-2">
          <div className="grid grid-cols-3 gap-0.5 w-fit">
            <div />
            <button
              onClick={handlePanUp}
              className="p-1.5 hover:bg-storm-700 rounded transition-colors text-storm-300 hover:text-storm-100"
              title="Pan Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div />
            <button
              onClick={handlePanLeft}
              className="p-1.5 hover:bg-storm-700 rounded transition-colors text-storm-300 hover:text-storm-100"
              title="Pan Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="p-1.5 flex items-center justify-center text-storm-500">
              <Move className="w-3 h-3" />
            </div>
            <button
              onClick={handlePanRight}
              className="p-1.5 hover:bg-storm-700 rounded transition-colors text-storm-300 hover:text-storm-100"
              title="Pan Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div />
            <button
              onClick={handlePanDown}
              className="p-1.5 hover:bg-storm-700 rounded transition-colors text-storm-300 hover:text-storm-100"
              title="Pan Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div />
          </div>
        </div>
      </div>

      {/* Map info overlay - Bottom right */}
      <div className="absolute bottom-4 right-4 bg-storm-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-storm-700">
        <span className="text-sm text-storm-300">
          {activeMap.name} ({activeMap.width}x{activeMap.height})
        </span>
      </div>
    </div>
  );
};
