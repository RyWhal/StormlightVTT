// types/index.ts - TypeScript type definitions for Stormlight VTT

export type TokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export const TOKEN_SIZE_MULTIPLIERS: Record<TokenSize, number> = {
  tiny: 0.5,      // Half a grid square
  small: 1,       // 1x1 squares
  medium: 1,      // 1x1 squares
  large: 2,       // 2x2 squares
  huge: 3,        // 3x3 squares
  gargantuan: 4,  // 4x4 squares
};

export interface Session {
  id: string;
  code: string;
  name: string;
  activeMapId: string | null;
  currentGmUsername: string | null;
  notepadContent: string;
  allowPlayersRenameNpcs: boolean;
  allowPlayersMoveNpcs: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPlayer {
  id: string;
  sessionId: string;
  username: string;
  characterId: string | null;
  isGm: boolean;
  initiativeModifier: number;
  lastSeen: string;
}

export interface Map {
  id: string;
  sessionId: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  sortOrder: number;
  createdAt: string;

  // Grid
  gridEnabled: boolean;
  gridOffsetX: number;
  gridOffsetY: number;
  gridCellSize: number;
  gridColor: string;

  // Fog
  fogEnabled: boolean;
  fogDefaultState: 'fogged' | 'revealed';
  fogData: FogRegion[];

  showPlayerTokens: boolean;
}

export interface FogRegion {
  type: 'reveal' | 'hide';
  points: { x: number; y: number }[];
  brushSize: number;
}

export interface Character {
  id: string;
  sessionId: string;
  name: string;
  tokenUrl: string | null;
  positionX: number;
  positionY: number;
  isClaimed: boolean;
  claimedByUsername: string | null;
  inventory: InventoryItem[];
  notes: string;
  createdAt: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface NPCTemplate {
  id: string;
  sessionId: string;
  name: string;
  tokenUrl: string | null;
  defaultSize: TokenSize;
  notes: string;
  createdAt: string;
}

export interface NPCInstance {
  id: string;
  mapId: string;
  templateId: string | null;
  displayName: string | null;
  tokenUrl: string | null;
  size: TokenSize | null;
  positionX: number;
  positionY: number;
  isVisible: boolean;
  notes: string;
  createdAt: string;
}

export interface DiceRoll {
  id: string;
  sessionId: string;
  username: string;
  characterName: string | null;
  rollExpression: string;
  rollResults: RollResults;
  visibility: RollVisibility;
  plotDiceResults: PlotDieResult[] | null;
  createdAt: string;
}

export interface RollResults {
  dice: { type: string; count: number; results: number[] }[];
  modifier: number;
  total: number;
}

export type PlotDieFace = 'opportunity' | 'complication' | 'blank';

export interface PlotDieResult {
  face: PlotDieFace;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  username: string;
  message: string;
  isGmAnnouncement: boolean;
  createdAt: string;
}

export type RollVisibility = 'public' | 'gm_only' | 'self';

export type InitiativePhase = 'fast' | 'slow';
export type InitiativeVisibility = 'public' | 'gm_only';

export interface InitiativeEntry {
  id: string;
  sessionId: string;
  sourceType: 'player' | 'npc';
  sourceId: string | null;
  sourceName: string;
  rolledByUsername: string;
  modifier: number;
  rollValue: number | null;
  total: number | null;
  phase: InitiativePhase;
  visibility: InitiativeVisibility;
  isManualOverride: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InitiativeRollLog {
  id: string;
  sessionId: string;
  sourceType: 'player' | 'npc';
  sourceId: string | null;
  sourceName: string;
  rolledByUsername: string;
  phase: InitiativePhase;
  visibility: InitiativeVisibility;
  modifier: number;
  rollValue: number;
  total: number;
  entryId: string | null;
  createdAt: string;
}

// Session export/import types
export interface SessionExport {
  version: '1.0';
  exportedAt: string;
  session: {
    name: string;
    notepadContent: string;
  };
  maps: Array<{
    name: string;
    imageBase64: string;
    width: number;
    height: number;
    gridSettings: {
      enabled: boolean;
      offsetX: number;
      offsetY: number;
      cellSize: number;
      color: string;
    };
    fogSettings: {
      enabled: boolean;
      defaultState: string;
      fogData: FogRegion[];
    };
    showPlayerTokens: boolean;
    npcInstances: Array<{
      displayName: string;
      templateName: string;
      tokenBase64: string | null;
      size: TokenSize;
      positionX: number;
      positionY: number;
      isVisible: boolean;
      notes: string;
    }>;
  }>;
  characters: Array<{
    name: string;
    tokenBase64: string | null;
    inventory: InventoryItem[];
    notes: string;
  }>;
  npcTemplates: Array<{
    name: string;
    tokenBase64: string | null;
    defaultSize: TokenSize;
    notes: string;
  }>;
}

// Database row types (snake_case as returned from Supabase)
export interface DbSession {
  id: string;
  code: string;
  name: string;
  active_map_id: string | null;
  current_gm_username: string | null;
  notepad_content: string;
  allow_players_rename_npcs: boolean;
  allow_players_move_npcs: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSessionPlayer {
  id: string;
  session_id: string;
  username: string;
  character_id: string | null;
  is_gm: boolean;
  initiative_modifier: number;
  last_seen: string;
}

export interface DbMap {
  id: string;
  session_id: string;
  name: string;
  image_url: string;
  width: number;
  height: number;
  sort_order: number;
  created_at: string;
  grid_enabled: boolean;
  grid_offset_x: number;
  grid_offset_y: number;
  grid_cell_size: number;
  grid_color: string;
  fog_enabled: boolean;
  fog_default_state: 'fogged' | 'revealed';
  fog_data: FogRegion[];
  show_player_tokens: boolean;
}

export interface DbCharacter {
  id: string;
  session_id: string;
  name: string;
  token_url: string | null;
  position_x: number;
  position_y: number;
  is_claimed: boolean;
  claimed_by_username: string | null;
  inventory: InventoryItem[];
  notes: string;
  created_at: string;
}

export interface DbNPCTemplate {
  id: string;
  session_id: string;
  name: string;
  token_url: string | null;
  default_size: TokenSize;
  notes: string;
  created_at: string;
}

export interface DbNPCInstance {
  id: string;
  map_id: string;
  template_id: string | null;
  display_name: string | null;
  token_url: string | null;
  size: TokenSize | null;
  position_x: number;
  position_y: number;
  is_visible: boolean;
  notes: string;
  created_at: string;
}

export interface DbDiceRoll {
  id: string;
  session_id: string;
  username: string;
  character_name: string | null;
  roll_expression: string;
  roll_results: RollResults;
  visibility: RollVisibility;
  plot_dice_results: PlotDieResult[] | null;
  created_at: string;
}

export interface DbInitiativeEntry {
  id: string;
  session_id: string;
  source_type: 'player' | 'npc';
  source_id: string | null;
  source_name: string;
  rolled_by_username: string;
  modifier: number;
  roll_value: number | null;
  total: number | null;
  phase: InitiativePhase;
  visibility: InitiativeVisibility;
  is_manual_override: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbInitiativeRollLog {
  id: string;
  session_id: string;
  source_type: 'player' | 'npc';
  source_id: string | null;
  source_name: string;
  rolled_by_username: string;
  phase: InitiativePhase;
  visibility: InitiativeVisibility;
  modifier: number;
  roll_value: number;
  total: number;
  entry_id: string | null;
  created_at: string;
}

export interface DbChatMessage {
  id: string;
  session_id: string;
  username: string;
  message: string;
  is_gm_announcement: boolean;
  created_at: string;
}

// Utility type converters
export function dbSessionToSession(db: DbSession): Session {
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    activeMapId: db.active_map_id,
    currentGmUsername: db.current_gm_username,
    notepadContent: db.notepad_content,
    allowPlayersRenameNpcs: db.allow_players_rename_npcs ?? false,
    allowPlayersMoveNpcs: db.allow_players_move_npcs ?? false,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function dbMapToMap(db: DbMap): Map {
  return {
    id: db.id,
    sessionId: db.session_id,
    name: db.name,
    imageUrl: db.image_url,
    width: db.width,
    height: db.height,
    sortOrder: db.sort_order,
    createdAt: db.created_at,
    gridEnabled: db.grid_enabled,
    gridOffsetX: db.grid_offset_x,
    gridOffsetY: db.grid_offset_y,
    gridCellSize: db.grid_cell_size,
    gridColor: db.grid_color,
    fogEnabled: db.fog_enabled,
    fogDefaultState: db.fog_default_state,
    fogData: db.fog_data || [],
    showPlayerTokens: db.show_player_tokens,
  };
}

export function dbCharacterToCharacter(db: DbCharacter): Character {
  return {
    id: db.id,
    sessionId: db.session_id,
    name: db.name,
    tokenUrl: db.token_url,
    positionX: db.position_x,
    positionY: db.position_y,
    isClaimed: db.is_claimed,
    claimedByUsername: db.claimed_by_username,
    inventory: db.inventory || [],
    notes: db.notes,
    createdAt: db.created_at,
  };
}

export function dbNPCTemplateToNPCTemplate(db: DbNPCTemplate): NPCTemplate {
  return {
    id: db.id,
    sessionId: db.session_id,
    name: db.name,
    tokenUrl: db.token_url,
    defaultSize: db.default_size,
    notes: db.notes,
    createdAt: db.created_at,
  };
}

export function dbNPCInstanceToNPCInstance(db: DbNPCInstance): NPCInstance {
  return {
    id: db.id,
    mapId: db.map_id,
    templateId: db.template_id,
    displayName: db.display_name,
    tokenUrl: db.token_url,
    size: db.size,
    positionX: db.position_x,
    positionY: db.position_y,
    isVisible: db.is_visible,
    notes: db.notes,
    createdAt: db.created_at,
  };
}

export function dbDiceRollToDiceRoll(db: DbDiceRoll): DiceRoll {
  return {
    id: db.id,
    sessionId: db.session_id,
    username: db.username,
    characterName: db.character_name,
    rollExpression: db.roll_expression,
    rollResults: db.roll_results,
    visibility: db.visibility,
    plotDiceResults: db.plot_dice_results,
    createdAt: db.created_at,
  };
}

export function dbInitiativeEntryToInitiativeEntry(db: DbInitiativeEntry): InitiativeEntry {
  return {
    id: db.id,
    sessionId: db.session_id,
    sourceType: db.source_type,
    sourceId: db.source_id,
    sourceName: db.source_name,
    rolledByUsername: db.rolled_by_username,
    modifier: db.modifier ?? 0,
    rollValue: db.roll_value,
    total: db.total,
    phase: db.phase,
    visibility: db.visibility,
    isManualOverride: db.is_manual_override ?? false,
    sortOrder: db.sort_order ?? 0,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function dbInitiativeRollLogToInitiativeRollLog(db: DbInitiativeRollLog): InitiativeRollLog {
  return {
    id: db.id,
    sessionId: db.session_id,
    sourceType: db.source_type,
    sourceId: db.source_id,
    sourceName: db.source_name,
    rolledByUsername: db.rolled_by_username,
    phase: db.phase,
    visibility: db.visibility,
    modifier: db.modifier ?? 0,
    rollValue: db.roll_value,
    total: db.total,
    entryId: db.entry_id,
    createdAt: db.created_at,
  };
}

export function dbChatMessageToChatMessage(db: DbChatMessage): ChatMessage {
  return {
    id: db.id,
    sessionId: db.session_id,
    username: db.username,
    message: db.message,
    isGmAnnouncement: db.is_gm_announcement,
    createdAt: db.created_at,
  };
}

export function dbSessionPlayerToSessionPlayer(db: DbSessionPlayer): SessionPlayer {
  return {
    id: db.id,
    sessionId: db.session_id,
    username: db.username,
    characterId: db.character_id,
    isGm: db.is_gm,
    initiativeModifier: db.initiative_modifier ?? 0,
    lastSeen: db.last_seen,
  };
}
