import { create } from 'zustand';
import type { Map, Character, NPCInstance, NPCTemplate, FogRegion } from '../types';

interface MapState {
  // Maps
  maps: Map[];
  activeMap: Map | null;

  // Characters (player tokens)
  characters: Character[];

  // NPCs
  npcTemplates: NPCTemplate[];
  npcInstances: NPCInstance[];

  // Viewport state
  viewportScale: number;
  viewportX: number;
  viewportY: number;
  stageWidth: number;
  stageHeight: number;

  // Selected token
  selectedTokenId: string | null;
  selectedTokenType: 'character' | 'npc' | null;

  // Fog tool state (GM only)
  fogToolMode: 'reveal' | 'hide' | null;
  fogBrushSize: 'small' | 'medium' | 'large';
  fogToolShape: 'brush' | 'rectangle';

  // Actions - Maps
  setMaps: (maps: Map[]) => void;
  addMap: (map: Map) => void;
  updateMap: (mapId: string, updates: Partial<Map>) => void;
  removeMap: (mapId: string) => void;
  setActiveMap: (map: Map | null) => void;

  // Actions - Characters
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  removeCharacter: (characterId: string) => void;
  moveCharacter: (characterId: string, x: number, y: number) => void;

  // Actions - NPC Templates
  setNPCTemplates: (templates: NPCTemplate[]) => void;
  addNPCTemplate: (template: NPCTemplate) => void;
  updateNPCTemplate: (templateId: string, updates: Partial<NPCTemplate>) => void;
  removeNPCTemplate: (templateId: string) => void;

  // Actions - NPC Instances
  setNPCInstances: (instances: NPCInstance[]) => void;
  addNPCInstance: (instance: NPCInstance) => void;
  updateNPCInstance: (instanceId: string, updates: Partial<NPCInstance>) => void;
  removeNPCInstance: (instanceId: string) => void;
  moveNPCInstance: (instanceId: string, x: number, y: number) => void;

  // Actions - Viewport
  setViewportScale: (scale: number) => void;
  setViewportPosition: (x: number, y: number) => void;
  setStageSize: (width: number, height: number) => void;
  resetViewport: () => void;
  fitMapToView: () => void;
  panBy: (dx: number, dy: number) => void;
  zoomTo: (scale: number, centerOnScreen?: boolean) => void;

  // Actions - Selection
  selectToken: (id: string | null, type: 'character' | 'npc' | null) => void;
  clearSelection: () => void;

  // Actions - Fog tools
  setFogToolMode: (mode: 'reveal' | 'hide' | null) => void;
  setFogBrushSize: (size: 'small' | 'medium' | 'large') => void;
  setFogToolShape: (shape: 'brush' | 'rectangle') => void;
  addFogRegion: (mapId: string, region: FogRegion) => void;
  clearFog: (mapId: string) => void;
  resetFog: (mapId: string) => void;

  // Clear all state
  clearMapState: () => void;
}

const FOG_BRUSH_SIZES = {
  small: 30,
  medium: 60,
  large: 120,
};

export const useMapStore = create<MapState>()((set, get) => ({
  // Initial state
  maps: [],
  activeMap: null,
  characters: [],
  npcTemplates: [],
  npcInstances: [],
  viewportScale: 1,
  viewportX: 0,
  viewportY: 0,
  stageWidth: 800,
  stageHeight: 600,
  selectedTokenId: null,
  selectedTokenType: null,
  fogToolMode: null,
  fogBrushSize: 'medium',
  fogToolShape: 'brush',

  // Map actions
  setMaps: (maps) => set({ maps }),

  addMap: (map) =>
    set((state) => ({
      maps: [...state.maps.filter((m) => m.id !== map.id), map],
    })),

  updateMap: (mapId, updates) =>
    set((state) => ({
      maps: state.maps.map((m) => (m.id === mapId ? { ...m, ...updates } : m)),
      activeMap:
        state.activeMap?.id === mapId
          ? { ...state.activeMap, ...updates }
          : state.activeMap,
    })),

  removeMap: (mapId) =>
    set((state) => ({
      maps: state.maps.filter((m) => m.id !== mapId),
      activeMap: state.activeMap?.id === mapId ? null : state.activeMap,
    })),

  setActiveMap: (map) => {
    set({ activeMap: map });
    // Auto-fit map to view when a new map is activated
    if (map) {
      setTimeout(() => get().fitMapToView(), 50);
    }
  },

  // Character actions
  setCharacters: (characters) => set({ characters }),

  addCharacter: (character) =>
    set((state) => ({
      characters: [
        ...state.characters.filter((c) => c.id !== character.id),
        character,
      ],
    })),

  updateCharacter: (characterId, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId ? { ...c, ...updates } : c
      ),
    })),

  removeCharacter: (characterId) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== characterId),
      selectedTokenId:
        state.selectedTokenId === characterId ? null : state.selectedTokenId,
      selectedTokenType:
        state.selectedTokenId === characterId ? null : state.selectedTokenType,
    })),

  moveCharacter: (characterId, x, y) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId ? { ...c, positionX: x, positionY: y } : c
      ),
    })),

  // NPC Template actions
  setNPCTemplates: (templates) => set({ npcTemplates: templates }),

  addNPCTemplate: (template) =>
    set((state) => ({
      npcTemplates: [
        ...state.npcTemplates.filter((t) => t.id !== template.id),
        template,
      ],
    })),

  updateNPCTemplate: (templateId, updates) =>
    set((state) => ({
      npcTemplates: state.npcTemplates.map((t) =>
        t.id === templateId ? { ...t, ...updates } : t
      ),
    })),

  removeNPCTemplate: (templateId) =>
    set((state) => ({
      npcTemplates: state.npcTemplates.filter((t) => t.id !== templateId),
    })),

  // NPC Instance actions
  setNPCInstances: (instances) => set({ npcInstances: instances }),

  addNPCInstance: (instance) =>
    set((state) => ({
      npcInstances: [
        ...state.npcInstances.filter((i) => i.id !== instance.id),
        instance,
      ],
    })),

  updateNPCInstance: (instanceId, updates) =>
    set((state) => ({
      npcInstances: state.npcInstances.map((i) =>
        i.id === instanceId ? { ...i, ...updates } : i
      ),
    })),

  removeNPCInstance: (instanceId) =>
    set((state) => ({
      npcInstances: state.npcInstances.filter((i) => i.id !== instanceId),
      selectedTokenId:
        state.selectedTokenId === instanceId ? null : state.selectedTokenId,
      selectedTokenType:
        state.selectedTokenId === instanceId ? null : state.selectedTokenType,
    })),

  moveNPCInstance: (instanceId, x, y) =>
    set((state) => ({
      npcInstances: state.npcInstances.map((i) =>
        i.id === instanceId ? { ...i, positionX: x, positionY: y } : i
      ),
    })),

  // Viewport actions
  setViewportScale: (scale) =>
    set({ viewportScale: Math.max(0.1, Math.min(5, scale)) }),

  setViewportPosition: (x, y) => set({ viewportX: x, viewportY: y }),

  setStageSize: (width, height) => set({ stageWidth: width, stageHeight: height }),

  resetViewport: () => set({ viewportScale: 1, viewportX: 0, viewportY: 0 }),

  fitMapToView: () => {
    const state = get();
    const { activeMap, stageWidth, stageHeight } = state;
    if (!activeMap || stageWidth === 0 || stageHeight === 0) return;

    // Keep a small, responsive edge margin so wide/tall maps can use more of the viewport
    const padding = Math.max(16, Math.min(40, Math.round(Math.min(stageWidth, stageHeight) * 0.02)));
    const availableWidth = Math.max(1, stageWidth - padding * 2);
    const availableHeight = Math.max(1, stageHeight - padding * 2);

    // Calculate scale to fit map in view
    const scaleX = availableWidth / activeMap.width;
    const scaleY = availableHeight / activeMap.height;
    const scale = Math.max(0.1, Math.min(scaleX, scaleY));

    // Center the map
    const scaledWidth = activeMap.width * scale;
    const scaledHeight = activeMap.height * scale;
    const x = (stageWidth - scaledWidth) / 2;
    const y = (stageHeight - scaledHeight) / 2;

    set({
      viewportScale: scale,
      viewportX: x,
      viewportY: y,
    });
  },

  panBy: (dx, dy) =>
    set((state) => ({
      viewportX: state.viewportX + dx,
      viewportY: state.viewportY + dy,
    })),

  zoomTo: (scale, centerOnScreen = true) => {
    const state = get();
    const clampedScale = Math.max(0.1, Math.min(5, scale));

    if (centerOnScreen) {
      // Zoom towards center of screen
      const centerX = state.stageWidth / 2;
      const centerY = state.stageHeight / 2;

      const oldScale = state.viewportScale;
      const mousePointTo = {
        x: (centerX - state.viewportX) / oldScale,
        y: (centerY - state.viewportY) / oldScale,
      };

      const newPos = {
        x: centerX - mousePointTo.x * clampedScale,
        y: centerY - mousePointTo.y * clampedScale,
      };

      set({
        viewportScale: clampedScale,
        viewportX: newPos.x,
        viewportY: newPos.y,
      });
    } else {
      set({ viewportScale: clampedScale });
    }
  },

  // Selection actions
  selectToken: (id, type) =>
    set({ selectedTokenId: id, selectedTokenType: type }),

  clearSelection: () => set({ selectedTokenId: null, selectedTokenType: null }),

  // Fog actions
  setFogToolMode: (mode) => set({ fogToolMode: mode }),

  setFogBrushSize: (size) => set({ fogBrushSize: size }),

  setFogToolShape: (shape) => set({ fogToolShape: shape }),

  addFogRegion: (mapId, region) => {
    const state = get();
    const map = state.maps.find((m) => m.id === mapId);
    if (!map) return;

    const newFogData = [...map.fogData, region];
    set((state) => ({
      maps: state.maps.map((m) =>
        m.id === mapId ? { ...m, fogData: newFogData } : m
      ),
      activeMap:
        state.activeMap?.id === mapId
          ? { ...state.activeMap, fogData: newFogData }
          : state.activeMap,
    }));
  },

  clearFog: (mapId) => {
    // Reveal all fog (set fog data to cover everything with reveal)
    set((state) => ({
      maps: state.maps.map((m) =>
        m.id === mapId ? { ...m, fogData: [] } : m
      ),
      activeMap:
        state.activeMap?.id === mapId
          ? { ...state.activeMap, fogData: [] }
          : state.activeMap,
    }));
  },

  resetFog: (mapId) => {
    // Reset to default fog state (clear all regions)
    set((state) => ({
      maps: state.maps.map((m) =>
        m.id === mapId ? { ...m, fogData: [] } : m
      ),
      activeMap:
        state.activeMap?.id === mapId
          ? { ...state.activeMap, fogData: [] }
          : state.activeMap,
    }));
  },

  clearMapState: () =>
    set({
      maps: [],
      activeMap: null,
      characters: [],
      npcTemplates: [],
      npcInstances: [],
      viewportScale: 1,
      viewportX: 0,
      viewportY: 0,
      selectedTokenId: null,
      selectedTokenType: null,
      fogToolMode: null,
      fogToolShape: 'brush',
    }),
}));

// Selector hooks
export const useActiveMap = () => useMapStore((state) => state.activeMap);
export const useCharacters = () => useMapStore((state) => state.characters);
export const useNPCInstances = () => useMapStore((state) => state.npcInstances);
export const useSelectedToken = () =>
  useMapStore((state) => ({
    id: state.selectedTokenId,
    type: state.selectedTokenType,
  }));

// Get fog brush size in pixels
export const getFogBrushPixelSize = (size: 'small' | 'medium' | 'large'): number => {
  return FOG_BRUSH_SIZES[size];
};
